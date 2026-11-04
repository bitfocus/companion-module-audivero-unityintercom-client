const test = require("node:test");
const assert = require("node:assert/strict");
const dgram = require("node:dgram");
const { once } = require("node:events");
const { setTimeout: delay } = require("node:timers/promises");
const { InstanceStatus } = require("@companion-module/base");

// Exercise the real protocol/action/feedback methods. The host boundary below only
// records definitions/status/variables and supplies a real loopback UDP socket.
function instance() {
  return Object.assign(
    {
      id: "loopback-test",
      config: { host: "127.0.0.1", port: 0, buttonCount: 8, pressDelay: 10 },
      API_BUTTONS: 80,
      VARIABLES: [],
      POLL_TIMER: null,
      FIRST_POLL: true,
      udpQueue: [],
      udpSending: false,
      heldKey: null,
      values: {},
      log() {},
      updateStatus(value) {
        this.status = value;
      },
      setVariableValues(values) {
        Object.assign(this.values, values);
      },
      setVariableDefinitions(values) {
        this.variables = values;
      },
      setActionDefinitions(values) {
        this.actions = values;
      },
      setFeedbackDefinitions(values) {
        this.feedbacks = values;
      },
      checkFeedbacks() {},
    },
    require("../src/api"),
    require("../src/actions"),
    require("../src/feedbacks"),
    require("../src/variables"),
  );
}

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await delay(20);
  }
  assert.fail("Timed out waiting for loopback protocol");
}

test("UDP poll, identity, actions, feedback, variables and connection cleanup", async (t) => {
  const client = dgram.createSocket("udp4");
  const panel = instance();
  const socket = dgram.createSocket("udp4");
  panel.udp = socket;
  t.after(() => {
    panel.closeConnection();
    client.close();
  });
  client.bind(0, "127.0.0.1");
  socket.bind(0, "127.0.0.1");
  await Promise.all([once(client, "listening"), once(socket, "listening")]);
  socket.on("message", (data, remote) =>
    panel.checkMessage(panel, data, remote),
  );
  const messages = [];
  client.on("message", (data) => messages.push(JSON.parse(data.toString())));
  const send = (data) =>
    client.send(JSON.stringify(data), socket.address().port, "127.0.0.1");
  panel.DEVICEID = panel.getDeviceId();
  assert.match(panel.DEVICEID, /^[a-f0-9]{32}$/);
  assert.equal(panel.getDeviceId(), panel.DEVICEID);
  panel.initKeystates();
  panel.initActions();
  panel.initFeedbacks();
  panel.initVariables();
  send({ Type: "Poll" });
  await until(() => messages.length === 1);
  assert.equal(messages[0].Type, "Poll");
  assert.equal(messages[0].Version, "1.4");
  assert.equal(messages[0].DeviceID, panel.DEVICEID);
  assert.equal(panel.status, InstanceStatus.Ok);
  assert.equal(panel.config.remoteport, client.address().port);
  assert.ok(panel.POLL_TIMER);
  const layout = panel.getLayoutVersion();
  panel.config.buttonCount = 9;
  panel.initKeystates();
  assert.notEqual(panel.getLayoutVersion(), layout);
  send({
    Type: "SetText",
    DeviceID: "another-panel",
    Button: 0,
    Text: "Ignore",
  });
  send({ Type: "SetText", DeviceID: panel.DEVICEID, Button: 0, Text: "Talk" });
  send({ Type: "SetRed", Button: 0, Value: "1" });
  send({
    Type: "SetFeedback",
    Button: 0,
    Value: 1,
    Text: "Channel Name",
    Label: "Production",
  });
  await until(() => panel.values.channel_name === "Production");
  assert.equal(panel.values.button_1_text, "Button 1"); // Dynamic definitions reset button labels in stable source.
  assert.equal(panel.keyStates[0].text, "Talk");
  assert.equal(
    await panel.feedbacks.color.callback({
      options: { button: "0", color: "red" },
    }),
    true,
  );
  send({ Type: "SetRed", Button: 0, Value: "0" });
  await until(() => panel.keyStates[0].red === false);
  assert.equal(
    await panel.feedbacks.color.callback({
      options: { button: "0", color: "red" },
    }),
    false,
  );
  for (const name of [
    "button_press",
    "button_release",
    "rotate",
    "dialDown",
    "dialUp",
  ]) {
    await panel.actions[name].callback({
      options: { button: "2", direction: "left", steps: 3 },
    });
  }
  await until(() => messages.length === 6 && !panel.udpSending);
  assert.deepEqual(
    messages.slice(1).map((m) => m.Type),
    ["Keydown", "Keyup", "Rotate", "Dialdown", "Dialup"],
  );
  assert.equal(messages[3].Ticks, -3);
  assert.ok(
    messages
      .slice(1)
      .every((m) => m.Button === 2 && m.DeviceID === panel.DEVICEID),
  );
  panel.RegisterDisconnect();
  assert.equal(panel.status, InstanceStatus.Error);
  assert.equal(panel.POLL_TIMER, null);
  panel.FIRST_POLL = true;
  send({ Type: "Poll" });
  await until(() => panel.status === InstanceStatus.Ok);
  panel.closeConnection();
  assert.equal(panel.POLL_TIMER, null);
  assert.equal(panel.udp, null);
  assert.equal(socket.listenerCount("message"), 0);
});
