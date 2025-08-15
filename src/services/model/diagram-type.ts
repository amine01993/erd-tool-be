export type ErdEdgeData = {
    startValue: string;
    endValue: string;
    order: number;
    length: number;
};


export interface DiagramData {
    id: string;
    name: string;
    viewport?: { x: number; y: number; zoom: number };
    createAt: string;
    lastUpdate: string;
    loaded?: boolean;
    selected?: boolean;
    history: {
        current: number;
        states: {
            nodes: any[];
            edges: any[];
        }[];
    };
}

export type EntityData = {
    name: string;
    attributes: AttributeData[];
}

export interface AttributeData {
    id: string;
    name: string;
    type: any;
    isNullable?: boolean;
    defaultValue?: any;
    isCurrent?: boolean;
    isPrimaryKey?: boolean;
    isAutoIncrement?: boolean;
    isUnique?: boolean;
    isForeignKey?: boolean;
    foreignKeyTable?: string;
    foreignKeyColumn?: string;
    length?: number;
    precision?: number;
    scale?: number;
    description?: string;
    isUnicode?: boolean;
}