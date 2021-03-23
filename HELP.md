## Audivero Unity Intercom Client

This module will allow you to remotely operate the Unity Intercom client running on Mac or Windows.

### Configuration
* Enter the IP Address of the device in the configuration settings.
* The device will use UDP port 20119.

**Available Actions:**
The module functions by sending button presses to the Unity client API.
In order to know what the button actually does, check the assignment for that button number in the Unity User Interface.

It is rceommended that you use the Button Presets, because every API request requires both a "keydown" and "keyup" command to be sent, or the Unity client will stay in a latched state.