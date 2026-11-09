#!/usr/bin/env bash
# Promotes a user to Admin: adds them to the Cognito Admin group, updates
# their role in the Users table so GET /users shows it, and lets their
# notification subscription receive messages addressed to "admins".
echo "Usage: ./promote-admin.sh user@example.com"
set -euo pipefail

EMAIL="${1:?Usage: $0 <email>}"
STACK="serverless-task-manager"
REGION="eu-west-1"

output() {
  aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

POOL_ID=$(output UserPoolId)
USERS_TABLE="${STACK}-users"

aws cognito-idp admin-add-user-to-group --region "$REGION" \
  --user-pool-id "$POOL_ID" --username "$EMAIL" --group-name Admin

USER_ID=$(aws cognito-idp admin-get-user --region "$REGION" \
  --user-pool-id "$POOL_ID" --username "$EMAIL" \
  --query "UserAttributes[?Name=='sub'].Value" --output text)

aws dynamodb update-item --region "$REGION" --table-name "$USERS_TABLE" \
  --key "{\"userId\": {\"S\": \"$USER_ID\"}}" \
  --update-expression "SET #role = :admin" \
  --expression-attribute-names '{"#role": "role"}' \
  --expression-attribute-values '{":admin": {"S": "Admin"}}'

TOPIC_ARN=$(output NotificationsTopicArn)
SUB_ARN=$(aws sns list-subscriptions-by-topic --region "$REGION" --topic-arn "$TOPIC_ARN" \
  --query "Subscriptions[?Endpoint=='$EMAIL'].SubscriptionArn | [0]" --output text)

if [[ "$SUB_ARN" == arn:* ]]; then
  aws sns set-subscription-attributes --region "$REGION" --subscription-arn "$SUB_ARN" \
    --attribute-name FilterPolicy \
    --attribute-value "{\"recipient\": [\"$USER_ID\", \"admins\"]}"
  echo "Admin notifications enabled for $EMAIL."
else
  echo "Note: $EMAIL has no confirmed notification subscription yet; run this again after they confirm it."
fi

echo "$EMAIL ($USER_ID) is now an Admin. They need to sign out and back in."
