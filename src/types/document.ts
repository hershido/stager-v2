export type Category = "instruments" | "equipment" | "musicians" | "labels";

// Base interface with common properties for all stage items
export interface BaseStageItem {
  id: string;
  name: string;
  category: Category;
  icon: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  isFlipped?: boolean;
}

// Specialized interface for labels
export interface LabelItem extends BaseStageItem {
  category: "labels";
  textContent: string;
  textFormatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    fontSize?: number;
    textColor?: string;
  };
}

// Union type that represents all possible stage items
export type StageItem = BaseStageItem | LabelItem;

// Type guard to check if an item is a LabelItem
export function isLabelItem(item: StageItem): item is LabelItem {
  return item.category === "labels";
}

export interface InputRow {
  id: string;
  number: string | number;
  name: string;
  channelType: string;
  standType: string;
}

export interface OutputRow {
  id: string;
  number: string | number;
  name: string;
  channelType: string;
  monitorType: string;
}

export interface StageInputOutput {
  inputs: InputRow[];
  outputs: OutputRow[];
}

export interface Person {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface MonitorItem {
  id: string;
  brand: string;
  type: string;
  quantity: number;
}

export interface TechnicalInfo {
  projectTitle: string;
  personnel: Person[];
  generalInfo: string;
  houseSystem: string;
  mixingDesk: string[] | string;
  monitors?: MonitorItem[];
  monitoring: string;
  backline: string;
  soundCheck: string;
}

export interface StagerDocument {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  version: string;

  stage: {
    width: number;
    height: number;
    backgroundColor: string;
    gridSize: number;
  };

  items: StageItem[];
  inputOutput: StageInputOutput;
  technicalInfo: TechnicalInfo;
}

export function createInitialDocument(): StagerDocument {
  const timestamp = Date.now();

  return {
    id: crypto.randomUUID(),
    name: "Untitled Stage Plan",
    createdAt: timestamp,
    updatedAt: timestamp,
    version: "1.0",

    stage: {
      width: 1200,
      height: 800,
      backgroundColor: "#f5f5f5",
      gridSize: 20,
    },

    items: [],

    inputOutput: {
      inputs: [],
      outputs: [],
    },

    technicalInfo: {
      projectTitle: "",
      personnel: [],
      generalInfo: "",
      houseSystem: "",
      mixingDesk: "",
      monitors: [],
      monitoring: "",
      backline: "",
      soundCheck: "",
    },
  };
}
