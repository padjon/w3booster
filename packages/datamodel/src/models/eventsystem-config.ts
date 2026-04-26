import { BaseModel } from './base';

export enum EEventsystemConfigTarget {
    OBS,
    STREAMLABS,
    XSPLIT
}

export class EventsystemConfig extends BaseModel {
    public static PARSE_CLASSNAME = 'EventsystemConfig';
    private _rules: Array<EventsystemConfigRule>;
    private _target: EEventsystemConfigTarget;

    constructor() {
        super(EventsystemConfig.PARSE_CLASSNAME);
        this.rules = new Array<EventsystemConfigRule>();
    }

    public get target(): EEventsystemConfigTarget {
        return this._target;
    }

    public set target(value: EEventsystemConfigTarget) {
        this._target = value;
    }

    public get rules(): Array<EventsystemConfigRule> {
        return this._rules;
    }

    public set rules(value: Array<EventsystemConfigRule>) {
        this._rules = value;
    }

    public getAllTriggerTypes(): Array<EEventsystemConfigRuleTriggerType> {
        return [].concat.apply([], this.rules.map((ruleSet) => ruleSet.trigger));
    }
}

BaseModel.registerClass(EventsystemConfig, EventsystemConfig.PARSE_CLASSNAME);

export class EventsystemConfigRule {
    trigger: EventsystemConfigRuleTrigger;
    actions = new Array<EventsystemConfigRuleAction>();
}

export class EventsystemConfigRuleTrigger {
    constructor(type: EEventsystemConfigRuleTriggerType, condition?: any) {
        this.triggerType = type;
        this.condition = condition;
    }
    triggerType: EEventsystemConfigRuleTriggerType;
    condition: any;
}

export enum EEventsystemConfigRuleTriggerType {
    WC3_STARTED,
    WC3_ENDED,
    GAME_STARTED,
    GAME_ENDED,
}

export enum EEventsystemConfigRuleActionType {
    SWITCH_SOURCE_VISIBILITY,
    SWITCH_SCENE,
}

export class EventsystemConfigRuleAction {
    readonly actionType: EEventsystemConfigRuleActionType;
}

export enum EEventsystemActionSourceVisibility {
    SHOW,
    HIDE
}

export namespace EventsystemConfigRuleActions {
    export class SwitchSourceVisibility extends EventsystemConfigRuleAction {
        readonly actionType = EEventsystemConfigRuleActionType.SWITCH_SOURCE_VISIBILITY;
        sceneId: string;
        sourceId: string;
        duration: number;
        operation: EEventsystemActionSourceVisibility;
    }

    export class SwitchScene extends EventsystemConfigRuleAction {
        readonly actionType = EEventsystemConfigRuleActionType.SWITCH_SCENE;
        sceneId: string;
    }
}
