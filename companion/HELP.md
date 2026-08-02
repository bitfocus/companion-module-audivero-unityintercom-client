## Audivero Unity Intercom Client

This module will allow you to remotely operate the Unity Intercom client running on Mac or Windows.

### Configuration

- Enter the IP Address of the Unity Intercom Client in the configuration settings.
- The device will use UDP port 20119.
- If it is not the same as the local computer, you will need to enter the Companion computer's IP address in the Unity Client settings. See [this article]([https://www.unityintercom.com/unity-tech-notes/remote-stream-deck-control-for-mac-and-windows-clients).
- "Press Hold Time" controls how long the module waits between sending a press and its matching release. The default of 50ms suits most clients. If short presses (like selecting a listen channel) are not registering, raise this value.

**Available Actions:**
The module functions by sending button presses to the Unity client API.
In order to know what the button actually does, check the assignment for that button number in the Unity User Interface.

It is rceommended that you use the Button Presets, because every API request requires both a "keydown" and "keyup" command to be sent, or the Unity client will stay in a latched state.
