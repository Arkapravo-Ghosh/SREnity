import {
  Activity,
  Clock,
  Database,
  FileSearch,
  FileText,
  Hash,
  History,
  ListChecks,
  MessageSquareText,
  Ticket,
  type LucideIcon,
} from "lucide-react";

/*
 * Simulated incidents for the live demo. Every number in a scenario must agree across its context,
 * timing, timeline, attempts, history and PIR: the demo sells evidence, so it can't contradict itself.
 */

/** `source` names the system and record a line was read from: the timeline is evidence, not narration. */
export type DemoEvent = {
  time: string;
  title: string;
  detail: string;
  source: string;
  tone: "alert" | "neutral" | "signal" | "done";
};

export type DemoAttempt = {
  time: string;
  action: string;
  /** What monitoring showed afterwards, not what people said. */
  verdict: "worked" | "did_not_work" | "disputed";
  outcome: string;
  source: string;
};

export type DemoPastIncident = {
  id: string;
  title: string;
  resolved: string;
  took: string;
  matchedBy: string[];
  why: string;
  /** Exact words from the past ticket's resolution notes. */
  fix: string;
  fixSource: string;
  lesson: string;
};

export type DemoIncident = {
  key: string;
  picker: string;
  id: string;
  priority: string;
  title: string;
  opened: string;
  fields: [string, string][];
  stages: { icon: LucideIcon; label: string; detail: string }[];
  /** The sources SREnity read for this incident: every output line cites one of them. */
  evidence: { icon: LucideIcon; label: string; system: string; value: string }[];
  /** Skimmable context for whoever picks the incident up next. */
  context: { text: string; source: string }[];
  /** The one thing no record could answer, said plainly instead of guessed. */
  gap: string;
  timing: { value: string; label: string }[];
  tried: DemoAttempt[];
  events: DemoEvent[];
  history: { takeaways: string[]; matches: DemoPastIncident[] };
  /** Headline figures for the PIR's impact assessment. */
  impact: { value: string; label: string }[];
  /** The RCA: section 3 of the PIR. */
  rootCause: string;
  rootCauseBasis: string;
  pir: DemoPir;
};

/**
 * Post-incident review, in the section order of a standard PIR report. Every fact must agree with
 * the incident's timeline and emails; anything the evidence can't settle is marked, not invented.
 */
export type DemoPir = {
  title: string;
  date: string;
  reportDate: string;
  purpose: string;
  description: string;
  impact: string;
  contributing: string[];
  initialResponse: string;
  mitigation: string;
  communication: string;
  resolution: string;
  recovery: string;
  gaps: string;
  improvements: string;
  actions: { action: string; owner: string; due: string }[];
  followUp: string;
  responseTeam: string;
  pirTeam: string;
  incidentRecord: string;
  evidence: string;
  review: string;
  distribution: string;
  conclusion: string;
};

const network: DemoIncident = {
  key: "network",
  picker: "WAN degradation · P2",
  id: "INC0012346",
  priority: "P2",
  title: "High packet loss and latency on Kolkata–Chennai WAN link",
  opened: "Opened 10:14 IST · 4 responders",
  fields: [
    ["Category", "Network / WAN Degradation"],
    ["Service", "Broadband Internet Service"],
    ["CI", "WAN-LINK-KOL-CHN-01"],
    ["Group", "Network Operations"],
    ["Impact", "1 – High"],
    ["Urgency", "2 – Medium"],
  ],
  stages: [
    { icon: Database, label: "Connecting to your ITSM", detail: "INC0012346 · ticket · field history" },
    { icon: FileSearch, label: "Reading work notes & field history", detail: "9 notes · 4 responders · 3 reassignments" },
    { icon: Hash, label: "Reading team chat", detail: "#noc-kolkata · 26 messages · 7 about this incident" },
    { icon: Activity, label: "Matching monitoring alerts", detail: "loss & RTT alarm on this circuit" },
    { icon: Clock, label: "Building the incident timeline", detail: "8 events · each cited to its source" },
    { icon: ListChecks, label: "Checking what was already tried", detail: "3 actions · checked against monitoring" },
    { icon: History, label: "Finding similar past incidents", detail: "3 earlier faults on this circuit" },
    { icon: FileText, label: "Compiling the PIR report", detail: "RCA · timing · lessons · action plan" },
  ],
  evidence: [
    { icon: Ticket, label: "Incident ticket", system: "ITSM tool", value: "INC0012346 · field history · 3 reassignments" },
    { icon: MessageSquareText, label: "Work notes", system: "ITSM tool", value: "9 notes · 4 responders" },
    { icon: Hash, label: "Team chat", system: "Slack / Teams", value: "#noc-kolkata · 7 linked messages" },
    { icon: Activity, label: "Monitoring alerts", system: "Monitoring platform", value: "Loss & RTT alarm · interface counters" },
  ],
  context: [
    { text: "Kolkata branch had up to 4% packet loss to the Chennai data center.", source: "Monitoring · alarm" },
    { text: "The fault was inside the carrier's network, past the ISP handoff, not in our equipment.", source: "ITSM · work note" },
    { text: "Users recovered at 10:36, once traffic moved to the backup link.", source: "ITSM · work note" },
    { text: "The carrier replaced a degraded optical segment; the primary link was back at 0% loss by 14:10.", source: "Monitoring · metrics" },
  ],
  gap: "When the carrier fault actually started: it is in none of the records, so SREnity says so instead of guessing.",
  timing: [
    { value: "6m", label: "Detection lag · alarm before ticket" },
    { value: "3h 56m", label: "TTR · ticket opened → resolved" },
    { value: "4h 02m", label: "Impact · first alarm → resolved" },
    { value: "5h 10m", label: "MTTR · 3 past on this circuit" },
  ],
  tried: [
    {
      time: "10:18",
      action: "Bounced the branch edge router's WAN interface",
      verdict: "did_not_work",
      outcome: "Did not work. Loss stayed above 3% for another 18m.",
      source: "Chat · #noc-kolkata",
    },
    {
      time: "10:36",
      action: "Moved branch traffic to the backup LTE link",
      verdict: "worked",
      outcome: "Worked. Users recovered within 2m.",
      source: "ITSM · work note",
    },
    {
      time: "11:40",
      action: "Carrier said the line was repaired",
      verdict: "disputed",
      outcome: "Reported as fixed, but the primary link kept dropping packets until 13:52.",
      source: "Chat · #noc-kolkata",
    },
  ],
  events: [
    { time: "10:08", title: "Loss and latency alarm", detail: "WAN-LINK-KOL-CHN-01 · 2.6% loss · 162 ms RTT", source: "Monitoring · alarm", tone: "alert" },
    { time: "10:14", title: "INC0012346 raised · P2", detail: "Network Operations · ERP slow, video calls dropping", source: "ITSM · ticket", tone: "neutral" },
    { time: "10:18", title: "Edge interface bounced, loss continues", detail: "“bounced the WAN port on kol-edge-01, still dropping”", source: "Chat · #noc-kolkata", tone: "neutral" },
    { time: "10:21", title: "Fault isolated to carrier", detail: "Traceroute: 4% loss, 180 ms · loss begins at ISP handoff", source: "ITSM · work note", tone: "signal" },
    { time: "10:36", title: "Traffic rerouted to backup link", detail: "LTE/Internet path carrying branch traffic · users recover", source: "ITSM · work note", tone: "signal" },
    { time: "11:05", title: "Handed over to day shift", detail: "Night NOC → Network Operations · reassigned in the ticket", source: "ITSM · field history", tone: "neutral" },
    { time: "13:52", title: "Carrier repairs optical path", detail: "Degraded optical segment replaced", source: "ITSM · work note", tone: "neutral" },
    { time: "14:10", title: "Incident resolved", detail: "Primary path validated · 0% loss · 35 ms", source: "Monitoring · metrics", tone: "done" },
  ],
  history: {
    takeaways: [
      "Third carrier fault on this circuit in six months; each was fixed by the carrier, not by us.",
      "Moving traffic to the backup link is what restored users every time.",
      "Carrier repairs took 4–6 hours: fail over early instead of waiting for a fix.",
    ],
    matches: [
      {
        id: "INC0011872",
        title: "Packet loss on Kolkata–Chennai WAN link",
        resolved: "12 Sep 2026",
        took: "5h 40m",
        matchedBy: ["Same configuration item", "Shares packet loss, ISP handoff"],
        why: "Same circuit, loss starting at the same ISP handoff.",
        fix: "Carrier replaced faulty amplifier card; LTE failover held branch traffic",
        fixSource: "Resolution notes",
        lesson: "Fail over to the backup link first; the carrier fix takes hours.",
      },
      {
        id: "INC0011509",
        title: "Kolkata branch slow ERP and dropped calls",
        resolved: "18 Jul 2026",
        took: "4h 50m",
        matchedBy: ["Same configuration item"],
        why: "Same circuit and the same user symptoms.",
        fix: "Carrier repaired fibre cut near Howrah; primary path restored",
        fixSource: "Resolution notes",
        lesson: "Ask the carrier for optical-layer alarms; both faults were found by our own probes.",
      },
      {
        id: "INC0010733",
        title: "High latency on Kolkata WAN after carrier maintenance",
        resolved: "02 May 2026",
        took: "5h 00m",
        matchedBy: ["Same configuration item"],
        why: "Same circuit; started right after a carrier maintenance window.",
        fix: "Carrier rolled back maintenance change on PE router",
        fixSource: "Work note",
        lesson: "Check the carrier's maintenance calendar before deeper troubleshooting.",
      },
    ],
  },
  impact: [
    { value: "28 min", label: "Degraded until reroute" },
    { value: "4%", label: "Peak packet loss" },
    { value: "180 ms", label: "Avg RTT (baseline 35 ms)" },
    { value: "~350", label: "Branch users affected" },
  ],
  rootCause:
    "A degraded optical path in the carrier network between the Kolkata ISP handoff and the Chennai data center. Our branch edge router and SD-WAN device were healthy throughout.",
  rootCauseBasis: "Stated by the carrier on TT-58817 · backed by traceroute and edge counters",
  pir: {
    title: "High packet loss and latency on Kolkata–Chennai WAN link (INC0012346 · P2)",
    date: "Tuesday 3 November 2026, 10:08 IST",
    reportDate: "Draft generated 3 November 2026 at resolution · final due Friday 6 November 2026",
    purpose:
      "Review the WAN degradation at the Kolkata branch, establish the root cause, and agree actions that stop the next carrier fault from reaching branch users.",
    description:
      "From 10:08 IST, the primary MPLS link WAN-LINK-KOL-CHN-01 between the Kolkata branch and the Chennai data center ran at up to 4% packet loss and 180 ms average RTT. Users were degraded for 28 minutes until traffic moved to the backup LTE/Internet link at 10:36. The primary path was restored and validated at 14:10.",
    impact:
      "About 350 branch users saw slow ERP access, dropped video calls and stalled file transfers, and 38 raised service-desk tickets. No data was lost.",
    contributing: [
      "Failover to the backup link was manual, so users felt 28 minutes of degradation before the reroute.",
      "No carrier optical-layer alarms reach us for this circuit, so the fault was found from our own probes.",
    ],
    initialResponse:
      "Monitoring raised a loss and latency alarm at 10:08 and INC0012346 was opened for Network Operations at 10:14. Traceroute from the branch edge isolated the fault to the carrier at 10:21, 13 minutes after the alarm.",
    mitigation:
      "Carrier ticket TT-58817 was raised at 10:29 with the traceroute evidence attached. Branch traffic was moved to the backup LTE/Internet link at 10:36, after which users recovered.",
    communication:
      "Status updates were posted in #noc-kolkata and on the ticket; Network Operations kept the Kolkata branch head informed until the primary link was restored.",
    resolution:
      "The carrier replaced the degraded optical segment at 13:52. The primary path was validated at 0% loss and 35 ms before branch traffic returned to it.",
    recovery:
      "Alarm 10:08 · fault isolated 10:21 · carrier ticket 10:29 · rerouted 10:36 · carrier repair 13:52 · resolved 14:10 (IST).",
    gaps:
      "Failover to the backup link depends on a manual step, and the backup link has not been load-tested at full branch traffic. Carrier repair took 3\u00a0h 23\u00a0min against a 4\u00a0h target.",
    improvements:
      "Automate SD-WAN failover on loss and latency thresholds, and get the carrier's optical-layer alarms for this circuit.",
    actions: [
      { action: "Automate SD-WAN failover on loss > 2% or RTT > 150 ms for 3 min", owner: "NetOps", due: "Fri 6 Nov 2026" },
      { action: "Request carrier optical-layer alarms for this circuit", owner: "ISP escalations", due: "Set at PIR review" },
      { action: "Load-test the backup LTE/Internet link at full branch traffic", owner: "WAN support", due: "Set at PIR review" },
      { action: "Review carrier repair SLA and service credits", owner: "Vendor management", due: "Set at PIR review" },
    ],
    followUp: "To be scheduled at the PIR review, once action owners confirm deadlines.",
    responseTeam: "Network Operations (lead, 4 responders) with the carrier NOC on TT-58817.",
    pirTeam: "Network Operations, WAN support, ISP escalations and vendor management.",
    incidentRecord: "INC0012346 with 9 work notes from 4 responders, and carrier ticket TT-58817.",
    evidence:
      "Edge router probes, 12 traceroute runs, branch edge and SD-WAN interface counters, and 38 service-desk tickets. Each statement in this report links to one of them.",
    review: "Pending. This draft awaits review by the on-call engineer and Network Operations; SREnity never distributes a report itself.",
    distribution: "IT leadership, the Kolkata branch head, Network Operations and vendor management.",
    conclusion:
      "A degraded optical path in the carrier network caused 28 minutes of degraded service for about 350 Kolkata branch users. The fault was outside our network, but a manual failover step set how long users felt it. Automating failover and getting carrier optical alarms are the two changes that shorten the next one.",
  },
};

const application: DemoIncident = {
  key: "application",
  picker: "Checkout outage · P1",
  id: "INC0012347",
  priority: "P1",
  title: "Checkout API returning 5xx errors after release",
  opened: "Opened 14:06 UTC · 5 responders",
  fields: [
    ["Category", "Application / Service Outage"],
    ["Service", "Online Checkout"],
    ["CI", "checkout-api (prod)"],
    ["Group", "Payments Engineering"],
    ["Impact", "1 – High"],
    ["Urgency", "1 – High"],
  ],
  stages: [
    { icon: Database, label: "Connecting to your ITSM", detail: "INC0012347 · ticket · change records" },
    { icon: FileSearch, label: "Reading work notes & field history", detail: "11 notes · 5 responders" },
    { icon: Hash, label: "Reading team chat", detail: "#payments-incident · 41 messages · 9 about this incident" },
    { icon: Activity, label: "Matching monitoring alerts", detail: "5xx rate · p95 latency · error logs" },
    { icon: Clock, label: "Building the incident timeline", detail: "8 events · each cited to its source" },
    { icon: ListChecks, label: "Checking what was already tried", detail: "3 actions · checked against monitoring" },
    { icon: History, label: "Finding similar past incidents", detail: "2 earlier outages on checkout-api" },
    { icon: FileText, label: "Compiling the PIR report", detail: "RCA · timing · lessons · action plan" },
  ],
  evidence: [
    { icon: Ticket, label: "Ticket & change record", system: "ITSM tool", value: "INC0012347 · CHG0004512 config diff" },
    { icon: MessageSquareText, label: "Work notes", system: "ITSM tool", value: "11 notes · 5 responders" },
    { icon: Hash, label: "Team chat", system: "Slack / Teams", value: "#payments-incident · 9 linked messages" },
    { icon: Activity, label: "Monitoring alerts", system: "Monitoring platform", value: "5xx & latency alarm · app logs" },
  ],
  context: [
    { text: "About 1,900 customer checkouts failed; the error rate peaked at 18%.", source: "Monitoring · alarm" },
    { text: "It started 4 minutes after release v2.14.0 went out.", source: "ITSM · change record" },
    { text: "The release cut the database connection pool from 50 to 5; the database itself stayed healthy.", source: "ITSM · change record" },
    { text: "Rolling back to v2.13.4 restored checkout by 14:24.", source: "Monitoring · metrics" },
  ],
  gap: "Who approved the connection-pool change: no record names them, so SREnity flags it instead of guessing.",
  timing: [
    { value: "4m", label: "Detection lag · alarm before ticket" },
    { value: "18m", label: "TTR · ticket opened → resolved" },
    { value: "22m", label: "Impact · first alarm → resolved" },
    { value: "46m", label: "MTTR · 2 past on checkout-api" },
  ],
  tried: [
    {
      time: "14:09",
      action: "Restarted the checkout-api pods",
      verdict: "did_not_work",
      outcome: "Did not work. Errors stayed above 10% for another 15m.",
      source: "Chat · #payments-incident",
    },
    {
      time: "14:12",
      action: "Scaled checkout-api from 6 to 12 pods",
      verdict: "disputed",
      outcome: "Reported as “looks better”, but the error rate stayed above 10% for another 12m.",
      source: "Chat · #payments-incident",
    },
    {
      time: "14:19",
      action: "Rolled back to v2.13.4",
      verdict: "worked",
      outcome: "Worked. Errors back to baseline within 5m.",
      source: "ITSM · work note",
    },
  ],
  events: [
    { time: "13:58", title: "Release v2.14.0 deployed", detail: "checkout-api · change CHG0004512", source: "ITSM · change record", tone: "neutral" },
    { time: "14:02", title: "5xx error-rate alarm", detail: "checkout-api · 6.4% errors · p95 2.1 s", source: "Monitoring · alarm", tone: "alert" },
    { time: "14:06", title: "INC0012347 raised · P1", detail: "Payments Engineering · customers can't check out", source: "ITSM · ticket", tone: "neutral" },
    { time: "14:09", title: "Pods restarted, errors continue", detail: "“restarted checkout-api, still throwing 503s”", source: "Chat · #payments-incident", tone: "neutral" },
    { time: "14:11", title: "Fault isolated to the app tier", detail: "Logs: connection pool exhausted · database healthy", source: "Monitoring · app logs", tone: "signal" },
    { time: "14:15", title: "Linked to the release", detail: "CHG0004512 config diff: pool max 50 → 5", source: "ITSM · change record", tone: "signal" },
    { time: "14:19", title: "Rollback to v2.13.4 started", detail: "Deploy freeze on CHG0004512", source: "ITSM · work note", tone: "neutral" },
    { time: "14:24", title: "Incident resolved", detail: "Error rate 0.3% (baseline) · p95 340 ms", source: "Monitoring · metrics", tone: "done" },
  ],
  history: {
    takeaways: [
      "Both earlier checkout outages also started right after a release.",
      "Both were fixed by rolling back, not by restarting or scaling.",
      "When errors start minutes after a deploy, roll back first.",
    ],
    matches: [
      {
        id: "INC0011630",
        title: "Checkout errors after v2.11.0 release",
        resolved: "21 Aug 2026",
        took: "52m",
        matchedBy: ["Same configuration item", "Shares release, 5xx"],
        why: "Same service, errors starting minutes after a deploy.",
        fix: "Rolled back to v2.10.3; new retry setting caused thread starvation",
        fixSource: "Resolution notes",
        lesson: "Roll back within minutes when errors follow a deploy.",
      },
      {
        id: "INC0011102",
        title: "Payment step timing out for customers",
        resolved: "04 Jun 2026",
        took: "40m",
        matchedBy: ["Same configuration item"],
        why: "Same service; also a connection-pool setting.",
        fix: "Reverted DB pool timeout from 30s to 3s in CHG0003987",
        fixSource: "Resolution notes",
        lesson: "Check connection-pool settings in the latest change record first.",
      },
    ],
  },
  impact: [
    { value: "22 min", label: "Elevated errors (14:02–14:24)" },
    { value: "18%", label: "Peak checkout error rate" },
    { value: "4.2 s", label: "p95 latency (baseline 320 ms)" },
    { value: "~1,900", label: "Failed checkout attempts" },
  ],
  rootCause:
    "Release v2.14.0 lowered the checkout-api database connection pool from 50 to 5 in production config. At normal checkout load, requests waited for a free connection and timed out. The database itself stayed healthy.",
  rootCauseBasis: "Inferred from the CHG0004512 config diff, app logs and database metrics",
  pir: {
    title: "Checkout API returning 5xx errors after release (INC0012347 · P1)",
    date: "Wednesday 4 November 2026, 14:02 UTC",
    reportDate: "Draft generated 4 November 2026 at resolution · final due Friday 6 November 2026",
    purpose:
      "Review the checkout outage that followed release v2.14.0, establish the root cause, and agree actions that stop an unsafe configuration reaching production again.",
    description:
      "From 14:02 UTC, checkout-api returned 5xx errors on up to 18% of requests, with p95 latency of 4.2 s against a 320 ms baseline, after release v2.14.0 went out at 13:58. Rolling back to v2.13.4 at 14:19 brought errors back to the 0.3% baseline by 14:24.",
    impact:
      "About 1,900 checkout attempts failed over 22 minutes and 61 customers contacted support. Payment logs show no charges for failed orders.",
    contributing: [
      "Staging never ran enough concurrent traffic to exhaust 5 connections, so the change passed testing.",
      "No pre-release check compares connection-pool settings with production minimums.",
      "No alert fires on pool saturation; the first signal was failing customer requests.",
    ],
    initialResponse:
      "The 5xx error-rate alarm fired at 14:02 and INC0012347 was opened for Payments Engineering at 14:06. Application logs isolated the fault to the app tier at 14:11, with the database healthy.",
    mitigation:
      "The errors were linked to change CHG0004512 at 14:15. Rollback to v2.13.4 started at 14:19 and deploys under CHG0004512 were frozen.",
    communication:
      "Status updates were posted in #payments-incident and on the ticket for leadership, customer support and release management.",
    resolution:
      "checkout-api was rolled back to v2.13.4, which restored the previous pool size. Error rate and latency were confirmed back at baseline (0.3%, p95 340 ms) at 14:24.",
    recovery:
      "Release 13:58 · alarm 14:02 · fault isolated 14:11 · linked to release 14:15 · rollback 14:19 · resolved 14:24 (UTC).",
    gaps:
      "Configuration changes reach production without a check against production minimums, staging load is far below production concurrency, and releases go out without a canary stage.",
    improvements:
      "Validate pool settings in CI, release through a canary with automatic rollback, and alert on pool saturation before requests fail.",
    actions: [
      { action: "Validate connection-pool settings against production minimums in CI", owner: "Platform", due: "Fri 6 Nov 2026" },
      { action: "Canary releases with automatic rollback on 5xx > 2% for 3 min", owner: "Payments Engineering", due: "Set at PIR review" },
      { action: "Load-test staging at production concurrency before release", owner: "QA", due: "Set at PIR review" },
      { action: "Alert on pool saturation before requests fail", owner: "SRE", due: "Set at PIR review" },
    ],
    followUp: "To be scheduled at the PIR review, once action owners confirm deadlines.",
    responseTeam: "Payments Engineering (lead, 5 responders) with release management for CHG0004512.",
    pirTeam: "Payments Engineering, Platform, QA and SRE.",
    incidentRecord: "INC0012347 with 11 work notes from 5 responders, and change record CHG0004512.",
    evidence:
      "APM error-rate and latency series, application logs, database metrics, the CHG0004512 config diff, payment provider logs and 61 support contacts. Each statement in this report links to one of them.",
    review: "Pending. This draft awaits review by the on-call engineer and Payments Engineering; SREnity never distributes a report itself.",
    distribution: "E-commerce leadership, Payments Engineering, release management and customer support.",
    conclusion:
      "A connection-pool setting in release v2.14.0 caused 22 minutes of failed checkouts for about 1,900 attempts. The database was never at fault. Checking pool settings in CI and releasing through a canary would have stopped the change before customers saw it.",
  },
};

export const DEMO_INCIDENTS = [network, application];
