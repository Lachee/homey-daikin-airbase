'use strict';

import Homey, { Device, FlowCard } from 'homey';
import { DaikinClient } from "daikin-airbase";

type AutocompleteResult = {
  id: string
  name: string
}

type ZoneStateArgs = {
  device: Device;
  zone_name: AutocompleteResult;
}

type ZoneControlArgs = {
  device: Device;
  zone_name: AutocompleteResult;
  enabled: boolean;
};

function getDaikinClient(device: Device) {
  if (!('client' in device) || !device.client)
    throw new Error(
      'Device does not have a client, cannot control zone'
    )

  return device.client as DaikinClient;
}

module.exports = class MyApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Airbase has been initialized');

    // Zone state condition
    const zoneStateCondition = this.homey.flow.getConditionCard('is_zone_enabled');
    zoneStateCondition.registerArgumentAutocompleteListener("zone_name", this.onZoneNameAutocomplete);
    zoneStateCondition.registerRunListener(async ({ device, zone_name }: ZoneStateArgs, _) => {
      const zone = await getDaikinClient(device).zones.getZone(zone_name.id);
      if (!zone) throw new Error(`Zone ${zone_name.id} not found`);
      return zone.isOn;
    });

    // Zone enabling control
    const zoneControlAction = this.homey.flow.getActionCard('enable_zone');
    zoneControlAction.registerArgumentAutocompleteListener("zone_name", this.onZoneNameAutocomplete);
    zoneControlAction.registerRunListener(async ({ device, zone_name, enabled }: ZoneControlArgs) => {
      const zone = await getDaikinClient(device).zones.getZone(zone_name.id);
      if (!zone) throw new Error(`Zone ${zone_name.id} not found`);
      await getDaikinClient(device).zones.updateZone(zone.name, { isOn: enabled });
    })
  }

  private async onZoneNameAutocomplete(query: string, { device }: ZoneStateArgs): Promise<FlowCard.ArgumentAutocompleteResults> {
    const client = getDaikinClient(device);
    if (client.zones.getCachedZones().length === 0)
      await client.zones.getZones();

    return client.zones.getCachedZones().map(zone => ({
      id:   zone.name,
      name: zone.name,
    })).filter(zone => zone.name.toLowerCase().includes(query.toLowerCase()));
  }
}
