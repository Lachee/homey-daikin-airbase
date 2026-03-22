import Homey from 'homey';
import {DaikinClient, DiscoveredDevice, basic_info, discover} from "daikin-airbase";

class Driver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('MyDriver has been initialized');
        // const showToastActionCard = this.homey.flow.getActionCard('show_toast');
        // showToastActionCard.registerRunListener(async ({ device, message }: { device: Device; message: string }) => {
        //   console.log('Registered a device', device, message);
        // });
    }

    async onPair(session: Homey.Driver.PairSession): Promise<void> {
        await session.showView("select_device");

        // When the client is ready, we wills can the network
        session.setHandler("discover", async () => {
            const discovered = await DaikinClient.discover();
            return discovered.map(device => this.toListEntry(device));
        });

        // The client wants to use a manual IP address
        session.setHandler("probe", async ({ip}: { ip: string }) => {
            const normalizedIp = String(ip ?? "").trim();
            if (!normalizedIp)
                throw new Error("IP address is required");

            // Probe the device, making sure we can connect to it.
            // If all goochi, we will pass it onto the frontend
            const device = new DaikinClient({host: normalizedIp})
            const info = await basic_info(device.api);
            return this.toPairDevice({...info, discoveredAddress: normalizedIp, discoveredPort: info.port});
        });
    }

    /** Used for displaying in the list of devices */
    private toListEntry(info: DiscoveredDevice) {
        return {
            id: info.id,
            name: info.name,
            ip: info.discoveredAddress,
            mac: info.mac,
        }
    }

    /** Used for pairing */
    private toPairDevice(info: DiscoveredDevice) {
        return {
            name: info.name,
            data: {ip: info.id},
            store: {address: info.discoveredAddress},
        }
    }

}

module.exports = Driver;