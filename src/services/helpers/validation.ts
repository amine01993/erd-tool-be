import { DiagramData } from "../model/diagram-type";
import { FeedbackType } from "../model/feedback-type";

export class MissingFieldError extends Error {}

export function validateErdDiagram(data) {
    if((data as DiagramData).name === undefined)
        throw new MissingFieldError("`name` attribute not found");
    if((data as DiagramData).history === undefined)
        throw new MissingFieldError("`history` attribute not found");
    if((data as DiagramData).createdAt === undefined)
        throw new MissingFieldError("`createdAt` attribute not found");
    if((data as DiagramData).viewport === undefined)
        throw new MissingFieldError("`viewport` attribute not found");
    if((data as DiagramData).lastUpdate === undefined)
        throw new MissingFieldError("`lastUpdate` attribute not found");
    if((data as DiagramData).id === undefined)
        throw new MissingFieldError("`id` attribute not found");
}

export function validateFeedback(data) {
    if((data as FeedbackType).email === undefined)
        throw new MissingFieldError("`email` attribute not found");
    if((data as FeedbackType).message === undefined)
        throw new MissingFieldError("`message` attribute not found");
    if((data as FeedbackType).id === undefined)
        throw new MissingFieldError("`id` attribute not found");
}