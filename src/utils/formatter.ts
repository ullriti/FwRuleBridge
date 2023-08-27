import { Service } from "../model/service";

export function getService(service: Service): string {
  if (service.protocol === "ICMP") return "ICMP";
  if (service.protocol === "all") return "everything";
  if (service.fromPort === service.toPort)
    return `${service.fromPort}/${service.protocol}`;
  return `${service.fromPort}/${service.protocol} - ${service.toPort}/${service.protocol}`;
}
