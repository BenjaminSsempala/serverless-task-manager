import os

import boto3

cognito = boto3.client("cognito-idp")


def handler(event, context):
    # Only act on sign-up confirmation, not on forgot-password confirmation.
    if event["triggerSource"] == "PostConfirmation_ConfirmSignUp":
        cognito.admin_add_user_to_group(
            UserPoolId=event["userPoolId"],
            Username=event["userName"],
            GroupName=os.environ["DEFAULT_GROUP"],
        )
    return event
