# ── SES — domain identity for transactional email (password reset) ─
# Verifying the domain (rather than a single address) lets us send from
# noreply@<domain_name>. With hosted_zone_id set, the Easy-DKIM CNAMEs are
# published to Route53 and the identity verifies automatically on apply.
#
# NOTE: a new SES account is in the *sandbox* — it can only send to verified
# recipients. To email arbitrary users, request SES production access:
#   aws sesv2 put-account-details --production-access-enabled \
#     --mail-type TRANSACTIONAL --website-url https://<domain> --region <region>
# (or the "Request production access" button in the SES console).
resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.domain_name
  tags           = local.protect
}

# Easy-DKIM CNAME records (3) — only when we manage the zone.
resource "aws_route53_record" "ses_dkim" {
  count           = var.hosted_zone_id != "" ? 3 : 0
  zone_id         = var.hosted_zone_id
  name            = "${element(aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens, count.index)}._domainkey.${var.domain_name}"
  type            = "CNAME"
  ttl             = 600
  records         = ["${element(aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens, count.index)}.dkim.amazonses.com"]
  allow_overwrite = true
}
