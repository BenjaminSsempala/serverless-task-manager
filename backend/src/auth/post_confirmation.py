import os
from datetime import datetime, timezone

import boto3

cognito = boto3.client("cognito-idp")
users_table = boto3.resource("dynamodb").Table(os.environ["USERS_TABLE"])


def handler(event, context):
    # Act on sign-up confirmation
    if event["triggerSource"] == "PostConfirmation_ConfirmSignUp":
        group = os.environ["DEFAULT_GROUP"]
        cognito.admin_add_user_to_group(
            UserPoolId=event["userPoolId"],
            Username=event["userName"],
            GroupName=group,
        )

        # Save the user so Admins can pick them as an assignee (GET /users).
        attributes = event["request"]["userAttributes"]
        users_table.put_item(
            Item={
                "userId": attributes["sub"],
                "email": attributes["email"],
                "name": attributes.get("name", ""),
                "role": group,
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
        )
    return event
