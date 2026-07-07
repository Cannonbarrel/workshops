# Solutions / explanations

Read these *after* you've attempted each exercise. The reasoning matters more than the JSON.

## Exercise 1 — answers

The exact numbers depend on which version of the sandbox policy was applied. As of the AWS Data Lake lab's current policy:

1. **19 statements** total.
2. **18 Allow** + **1 Deny** (`DenyOutsideUSWest2`).
3. **`DenyOutsideUSWest2`** locks region. The pattern is "deny everything that isn't in this safe-list, when the requested region isn't us-west-2." It uses `NotAction` to carve out exceptions for global services (iam, sts) and a few essential cross-region read calls.
4. **`ManageOwnVirtualMFADevice`** for `iam:CreateVirtualMFADevice`. (`ManageMFAOnOwnUser` covers `EnableMFADevice` etc., but the *create* of the device itself is in the first MFA Sid because the resource type differs — `mfa/...` vs `user/...`.)
5. **`S3FullAccessOwnBuckets`** allows `s3:*` on `arn:aws:s3:::quicklabs-{USERNAME}-*` and `arn:aws:s3:::quicklabs-{USERNAME}-*/*`. So you can write to any bucket whose name starts with `quicklabs-<your-username>-` and any object inside it. Anything else is implicitly denied.

## Exercise 2 — answers

| # | Action | Region | Expected | Why |
|---|---|---|---|---|
| 1 | `s3:CreateBucket` on own bucket | us-west-2 | **allowed** | `S3CreateOwnBuckets` matches; `DenyOutsideUSWest2` condition is false (region equals us-west-2) so deny doesn't fire |
| 2 | `s3:CreateBucket` on own bucket | us-east-1 | **explicit Deny** | `DenyOutsideUSWest2` matches because region != us-west-2 and `s3:CreateBucket` isn't in the `NotAction` exception list |
| 3 | `s3:CreateBucket` on someone else's bucket name | us-west-2 | **implicit Deny** | No Allow matches the resource ARN (no `Allow` statement covers `quicklabs-someone-else-*`); no Deny fires either; default = deny |
| 4 | `iam:ChangePassword` on self | ap-south-1 | **allowed** | `iam:*` is in the `NotAction` of `DenyOutsideUSWest2`, so the deny never applies to IAM. Then `ReadOwnIamUser` allows it. IAM endpoints are global; this is by design. |

The key insight: explicit deny (#2) and implicit deny (#3) are the same outcome but different reasons. The CLI error messages differ slightly — explicit deny mentions the deny statement; implicit deny says "no identity-based policy allows the action."

## Exercise 3 — answers

1. **Implicit deny.** No Allow statement matches the resource (`quicklabs-someone-else-raw` doesn't fit your prefix), and no explicit Deny fires either. The error message will say "no identity-based policy allows the action" — that's the implicit-deny tell.
2. The trace: walk every Allow with `s3:*` or `s3:PutObject` in its action set, check if the resource ARN matches. None do — `S3FullAccessOwnBuckets` only matches `quicklabs-<USER>-*` paths. So it falls through to default deny.
3. **Minimum change** to add cross-bucket put without losing the boundary: add a new Allow statement with `s3:PutObject` on exactly the bucket you need — e.g. `arn:aws:s3:::quicklabs-someone-else-raw/*`. **Don't** loosen `S3FullAccessOwnBuckets` to `*`; that drops the entire boundary. The principle of least privilege says: add the smallest exception, not a wider hole.

## Exercise 4 — explanation

The pattern is identical to `S3FullAccessOwnBuckets` — Allow + scoped Resource. The two takeaways:

- AWS service Allow statements are **additive**. Adding a new Allow doesn't loosen the existing boundary; it just enables more actions on the resources you scope it to.
- The simulator returns `allowed` for the in-namespace resource and `implicitDeny` for the out-of-namespace one. That difference is what you're proving — your scoping works.

In production, when someone asks "give me s3:GetBucketInventoryConfiguration access," you write a small Allow like this, get it reviewed, ship it. The test before ship is exactly the simulator command in the lab.

## Exercise 5 — explanation

Bucket policy mechanics:

- **Identity-based policies** answer "what can principal X do?" — attached to user/role.
- **Resource-based policies** answer "who can do what to me?" — attached to the bucket itself. The `Principal` field is mandatory because you're saying *who* the rule applies to.
- `Principal: "*"` means "anyone, including unauthenticated callers." That's what makes the bucket public.
- `Resource: "arn:aws:s3:::bucket-name/public/*"` scopes the public read to a single key prefix; everything else stays gated by the default-deny.

The Public Access Block settings you turned off (`BlockPublicPolicy=false`, `RestrictPublicBuckets=false`) are AWS's safety net — without those, a public bucket policy is *silently overridden*. We had to relax them explicitly. **Production note:** never turn these off without a strong reason; many breaches are unintended public buckets.

## Exercise 6 — explanation

Three patterns in the reference solution worth absorbing:

1. **`Resource: "arn:aws:iam::*:user/${aws:username}"`** — `${aws:username}` is an IAM policy variable that AWS expands at evaluation time to the *calling* user's name. So this policy "self-scopes" to whoever is using it; one policy works for any intern principal you attach it to. No per-intern rendering needed.
2. **`StringNotEqualsIfExists` vs `StringNotEquals`** — `IfExists` means "if the key exists, compare; if not, treat as a match." Use `IfExists` on `aws:RequestedRegion` because some IAM/STS calls don't carry a region context, and you don't want the deny to misfire on those. Without `IfExists` the deny would fire on any call missing region context — which would lock the intern out of IAM entirely.
3. **No `s3:PutObject`, no `glue:CreateTable`, no `athena:UpdateWorkGroup`** — read-only is achieved by *omitting* the write actions, not by explicitly denying them. Implicit deny is enough for closed-set things you control; explicit deny is for open-set things (a region lock applies to *all* future actions you haven't listed).

If your tests fail: the most common bugs are (a) forgetting `s3:ListAllMyBuckets` so the intern can't even see they have buckets, (b) scoping `glue:Get*` too tightly with a database ARN — Glue's discovery APIs need `Resource: "*"` because they list across the catalog. Match the AWS API's resource semantics, not what feels logical.
