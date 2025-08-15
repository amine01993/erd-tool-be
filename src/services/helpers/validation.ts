import { DiagramData } from "../model/diagram-type";

export class MissingFieldError extends Error {}

export function validateErdDiagram(data) {
    if((data as DiagramData).name === undefined)
        throw new MissingFieldError("`name` attribute not found");
    if((data as DiagramData).history === undefined)
        throw new MissingFieldError("`history` attribute not found");
    if((data as DiagramData).createAt === undefined)
        throw new MissingFieldError("`createAt` attribute not found");
    if((data as DiagramData).viewport === undefined)
        throw new MissingFieldError("`viewport` attribute not found");
    if((data as DiagramData).lastUpdate === undefined)
        throw new MissingFieldError("`lastUpdate` attribute not found");
    if((data as DiagramData).id === undefined)
        throw new MissingFieldError("`id` attribute not found");
}