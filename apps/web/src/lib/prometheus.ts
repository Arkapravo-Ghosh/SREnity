import "server-only";

import { cache } from "react";
import { connectorRequest, type ConnectorConnection } from "@/lib/connector";

export const readPrometheusConnections = cache(async () => {
  const result = await connectorRequest<{ connections: ConnectorConnection[] }>("/providers/prometheus/connections");
  return result.connections.filter(connection => connection.status === "connected");
});
