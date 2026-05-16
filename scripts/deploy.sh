#!/usr/bin/env bash
# Production deploy to Cloud Run.
#
# Prereqs (one-time):
#   1. Install + auth gcloud:   gcloud auth login && gcloud config set project <PROJECT>
#   2. Enable APIs:             Cloud Run, Artifact Registry, Cloud Build, Secret Manager
#   3. Create secrets in Secret Manager — names must match the SECRETS list below.
#   4. Create the Artifact Registry repo:
#        gcloud artifacts repositories create versorefuerzo \
#          --repository-format=docker --location=$REGION
#
# Then any time you want to deploy:
#   PROJECT_ID=my-project REGION=us-central1 ./scripts/deploy.sh
#
# After the first deploy, copy the Cloud Run URL into
# Firebase → Authentication → Settings → Authorized domains.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:?set PROJECT_ID}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-versorefuerzo}"
REPO="${REPO:-versorefuerzo}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:$(date -u +%Y%m%d-%H%M%S)"

# Required NEXT_PUBLIC_* values — these are public Firebase web config
# values that get baked into the client bundle at build time. Not
# secrets, but they must be present at `gcloud builds submit` time.
: "${NEXT_PUBLIC_FIREBASE_API_KEY:?missing NEXT_PUBLIC_FIREBASE_API_KEY}"
: "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:?missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"
: "${NEXT_PUBLIC_FIREBASE_PROJECT_ID:?missing NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
: "${NEXT_PUBLIC_FIREBASE_APP_ID:?missing NEXT_PUBLIC_FIREBASE_APP_ID}"
: "${FIREBASE_PROJECT_ID:?missing FIREBASE_PROJECT_ID}"

# Server-only secrets resolved at runtime from Secret Manager. The names
# on the LHS are the env vars the app reads; RHS is the Secret Manager
# secret name. Keep these in sync with README §6 and lib/auth/firebase-admin.
SECRETS="DATABASE_URL=DATABASE_URL:latest,"
SECRETS+="FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,"
SECRETS+="FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,"
SECRETS+="APIBIBLE_KEY=APIBIBLE_KEY:latest"

# Plain env vars (non-secret). FIREBASE_PROJECT_ID is also referenced by
# the admin SDK; APIBIBLE_ID_* tells the app which Bibles the deployed key
# can serve (specs §9.2).
SET_ENV="FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},"
SET_ENV+="APIBIBLE_ID_NBLA=${APIBIBLE_ID_NBLA:-},"
SET_ENV+="APIBIBLE_ID_NVI=${APIBIBLE_ID_NVI:-},"
SET_ENV+="APIBIBLE_ID_RVR1960=${APIBIBLE_ID_RVR1960:-}"

# One substitutions string passed via a single --substitutions flag.
# `gcloud builds submit` rejects multiple --substitutions flags and
# treats stray --build-arg-style positionals as filename arguments,
# which is what the M7 review caught.
SUBSTITUTIONS="_IMAGE=${IMAGE}"
SUBSTITUTIONS+=",_REGION=${REGION}"
SUBSTITUTIONS+=",_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}"
SUBSTITUTIONS+=",_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"
SUBSTITUTIONS+=",_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
SUBSTITUTIONS+=",_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}"

echo "==> Building image $IMAGE"
gcloud builds submit \
  --project="$PROJECT_ID" \
  --config=scripts/cloudbuild.yaml \
  --substitutions="$SUBSTITUTIONS" \
  .

echo "==> Deploying $IMAGE to Cloud Run"
gcloud run deploy "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$IMAGE" \
  --allow-unauthenticated \
  --set-env-vars="$SET_ENV" \
  --set-secrets="$SECRETS"

echo "==> Done. Service URL:"
gcloud run services describe "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format='value(status.url)'
