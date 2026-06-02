locals {
  # Applied to every free (zero-cost) resource so the cleanup workflow
  # and manual audits can identify what must never be deleted.
  protect = { do_not_delete = "true" }

  # SES sender for transactional email (password reset). Defaults to
  # noreply@<domain_name>, which the SES domain identity verifies.
  ses_from_email = var.ses_from_email != "" ? var.ses_from_email : "noreply@${var.domain_name}"
}
