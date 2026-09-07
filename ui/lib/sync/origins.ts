/**
 * Transaction origins used to attribute Yjs writes.
 *
 * Every writer must tag its transactions so the remote sync handler can tell
 * a local echo from a genuine inbound change, and so agent edits are
 * distinguishable from another peer's. An untagged transaction has
 * `origin === null`, which is indistinguishable from a remote human.
 */
export const LOCAL_ORIGIN = "local";
export const AGENT_ORIGIN = "agent";
