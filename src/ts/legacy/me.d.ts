export declare class Me {
    static preferences: any;
    static loading: any[];
    private static eventer;
    static hasWorkflowRight(workflowName: string): Promise<boolean>;
    static readonly session: any;
    static savePreference(app: string): Promise<void>;
    static preference(app: string): Promise<any>;
    static revalidateTerms(): Promise<void>;
    static shouldRevalidate(): Promise<{}>;
    static onSessionReady(): Promise<{}>;
}
