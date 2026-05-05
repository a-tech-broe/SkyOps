locals {
  # Applied to every free (zero-cost) resource so the cleanup workflow
  # and manual audits can identify what must never be deleted.
  protect = { do_not_delete = "true" }
}
