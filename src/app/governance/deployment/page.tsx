import DeploymentConfig from "./DeploymentConfig";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployment Config — NTT Data | NexPlan",
};

export default function DeploymentPage() {
  return <DeploymentConfig />;
}