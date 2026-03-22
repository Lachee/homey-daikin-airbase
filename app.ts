'use strict';

import Homey, {Device} from 'homey';
import {DaikinClient} from "daikin-airbase";

type ZoneControlArgs = {
  device: Device;
  zone_name: string;
  enabled: boolean;
};

module.exports = class MyApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Airbase has been initialized');

    const zoneControlAction = this.homey.flow.getActionCard('zone_control');
    zoneControlAction.registerRunListener(async ({ device, zone_name, enabled } : ZoneControlArgs) => {
      if (!('client' in device) || !device.client)
        throw new Error(
          'Device does not have a client, cannot control zone'
        )

      const client = device.client as DaikinClient;
      await client.zones.setZone(zone_name, enabled);
    })
  }

}
