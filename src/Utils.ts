import { Fn, Stack } from "aws-cdk-lib";
import { APIGatewayProxyResult } from "aws-lambda";

export function getSuffixFromStack(stack: Stack) {
    const shortStackId = Fn.select(2, Fn.split("/", stack.stackId));
    const suffix = Fn.select(4, Fn.split("-", shortStackId));
    return suffix;
}

export function addCorsHeader(arg: APIGatewayProxyResult) {
    if (!arg.headers) {
        arg.headers = {};
    }
    arg.headers["Access-Control-Allow-Origin"] = "*";
    arg.headers["Access-Control-Allow-Methods"] = "*";
    arg.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization";
}
