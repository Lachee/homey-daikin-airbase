import Homey from 'homey';
import { ControlMode, DaikinClient } from 'daikin-airbase';
import {
  controlToThermostatMap,
  fanSpeedToPercentage,
  percentageToFanSpeed,
  thermostatToControlMap
} from "../../lib/Converters";

const POLL_RATE = 30_000;

class Device extends Homey.Device {

  private client!: DaikinClient;

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    const address = this.getStoreValue('address');
    if (!address) {
      this.error('No address stored for device');
      return;
    }

    this.client = new DaikinClient({ host: address as string });
    this.log('A airconditioner has been initialized: ', (await this.client.getBasicInfo()).name);

    // Refresh the state every 30 seconds
    await this.refreshControlState();
    this.homey.setInterval(async () => {
      try {
        await this.refreshControlState();
      } catch (err: any) {
        this.error('Failed to update control info', err);
      }
    }, POLL_RATE);

    // Add capability listeners
    this.registerCapabilityListener("target_temperature", async (value: number) => {
      await this.client.setTargetTemperature(Math.floor(value));
    })

    this.registerCapabilityListener("onoff", async (value: boolean) => {
      await this.client.setPowered(value);
    });

    this.registerCapabilityListener("fan_speed", async (value: number) => {
      const fanSpeed = percentageToFanSpeed(value);
      await this.client.setControlInfo({ fanSpeed })
    })

    this.registerCapabilityListener("fan_mode", async (value: string) => {
      switch (value) {
        default:
        case 'auto':
          await this.client.setControlInfo({ fanAuto: true, fanAirside: false });
          break;
        case 'on':
          await this.client.setControlInfo({ fanAuto: false, fanAirside: false });
          break;
        case 'airside':
          await this.client.setControlInfo({ fanAuto: false, fanAirside: true });
          break;
      }
    })

    this.registerCapabilityListener("thermostat_mode", async (value: string) => {
      const mode = thermostatToControlMap[value];
      await this.client.setMode(mode);
    })
  }

  /**
   * Fetches the control info from the device and updates the capabilities.
   */
  private async refreshControlState() {
    try {
      // Report the first sensor temperature as measure_temperature
      const temp = await this.client.getInsideTemperature();
      await this.setCapabilityValue('measure_temperature', temp);

      // Report the other capabilities to make sure they are in sync.
      //  We will check if their value is within in the correct range before snapping.
      //  This is to keep analogue values present and to remember the user's preference, even if it makes no
      //  real difference.
      const info = await this.client.getControlInfo();
      await this.setCapabilityValue("onoff", info.power);

      if (Math.floor(this.getCapabilityValue("target_temperature")) != info.targetTemperature)
        await this.setCapabilityValue('target_temperature', info.targetTemperature);

      if (percentageToFanSpeed(this.getCapabilityValue("fan_speed")) != info.fanSpeed)
        await this.setCapabilityValue("fan_speed", fanSpeedToPercentage(info.fanSpeed));

      await this.setCapabilityValue("fan_mode", info.fanAirside ? "airside" : (info.fanAuto ? "auto" : "on"));

      await this.setCapabilityValue("thermostat_mode", controlToThermostatMap[info.mode]);

    } catch (err: any) {
      this.error('Error while updating control info', err);
    }
  }


  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
                     oldSettings,
                     newSettings,
                     changedKeys,
                   }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log("MyDevice settings where changed");
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }
};

module.exports = Device;