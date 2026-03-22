import {ControlMode, FanSpeed} from "daikin-airbase";

export function fanSpeedToPercentage(fanSpeed: FanSpeed) {
  if (fanSpeed === FanSpeed.High)
    return 1;
  if (fanSpeed === FanSpeed.Medium)
    return 0.5;
  return 0;
}

export function percentageToFanSpeed(percentage: number): FanSpeed {
  if (percentage >= 0.66)
    return FanSpeed.High;
  if (percentage >= 0.33)
    return FanSpeed.Medium;
  return FanSpeed.Low;
}

export const thermostatToControlMap = {
  auto: ControlMode.Auto,
  heat: ControlMode.Hot,
  cool: ControlMode.Cool,
  fan: ControlMode.Fan,
  dry: ControlMode.Dry,
} as Record<string, ControlMode>;
export const controlToThermostatMap: Record<ControlMode, string> =
  Object.fromEntries(
    Object.entries(thermostatToControlMap).map(([k, v]) => [v, k])
  ) as Record<ControlMode, string>;

