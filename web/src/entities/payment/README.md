# Payment Entity

Payment types are shared by winner actions, auction completion, and dashboard
views. Payment authority remains on the backend.

Winner payment records pair the persisted payment with a public auction summary
for dashboard and my-wins views. The client never sends amount or winner truth.
