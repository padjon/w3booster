import { EventEmitter } from 'events';
import { EventsystemConfig } from '@app/data/models';
import { EEventsystemConfigTarget, EEventsystemConfigRuleTriggerType, EventsystemConfigRuleTrigger, EventsystemConfigRule, EventsystemConfigRuleAction, EEventsystemConfigRuleActionType, EEventsystemActionSourceVisibility, EventsystemConfigRuleActions } from '@app/data/common/models';

export interface Scene {
    name: string;
    id: string;
    nodes: [Source];
}

export interface Source {
    name: string;
    id: string;
}

export abstract class BroadcastingServiceInterface extends EventEmitter {
    private available = false;
    protected eventsystemConfig: EventsystemConfig;
    readonly targetType: EEventsystemConfigTarget;
    private availabilityPromise = null;
    private ruleMapByTrigger = new Map<EEventsystemConfigRuleTriggerType, Array<EventsystemConfigRule>>();

    public abstract fetchSources(): Promise<Array<Scene>>;
    protected abstract toggleSource(sceneId: string, sourceId: string, visible: boolean);
    protected abstract switchToScene(sceneId: string);

    constructor(targetType: EEventsystemConfigTarget) {
        super();
        this.targetType = targetType;
    }

    protected initialize() {
        this.becameUnavailable();
    }

    public isAvailable() {
        return this.available;
    }

    public setEventsystemConfig(eventsystemConfig: EventsystemConfig) {
        this.eventsystemConfig = eventsystemConfig;
        this.reloadEventsystemConfig();
    }

    public reloadEventsystemConfig() {
        this.ruleMapByTrigger.clear();
        if (this.eventsystemConfig) {
            for (const rule of this.eventsystemConfig.rules) {
                let rules = this.ruleMapByTrigger.get(rule.trigger.triggerType);
                if (!rules) {
                    rules = new Array();
                }
                rules.push(rule);
                this.ruleMapByTrigger.set(rule.trigger.triggerType, rules);
            }
        }
    }

    public handleGameEvent(eventType: EEventsystemConfigRuleTriggerType, data?: any) {
        console.warn('HANDLE EVENT: ' + eventType);
        if (this.isAvailable()) {
            const rules = this.ruleMapByTrigger.get(eventType);
            if (rules && rules.length > 0) {
                for (const rule of rules) {
                    for (const action of rule.actions) {
                        this.doAction(action);
                    }
                }
            }
        }
    }

    public whenAvailable(): Promise<null> {
        return this.availabilityPromise;
    }

    protected becameAvailable() {
        this.available = true;
        this.emit('AVAILABLE');
    }

    protected becameUnavailable() {
        this.available = false;
        this.emit('UNAVAILABLE');
        this.availabilityPromise = new Promise<void>((res) => {
            this.once('AVAILABLE', () => {
                res();
            });
        });
    }

    private doAction(rawAction: EventsystemConfigRuleAction) {
        switch (rawAction.actionType) {
            case EEventsystemConfigRuleActionType.SWITCH_SOURCE_VISIBILITY: {
                const action = rawAction as EventsystemConfigRuleActions.SwitchSourceVisibility;
                this.toggleSource(action.sceneId, action.sourceId, action.operation === EEventsystemActionSourceVisibility.SHOW);
            } break;

            case EEventsystemConfigRuleActionType.SWITCH_SCENE: {
                const action = rawAction as EventsystemConfigRuleActions.SwitchSourceVisibility;
                this.switchToScene(action.sceneId);
            } break;
        }
    }
}
