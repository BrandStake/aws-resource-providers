import { CodeCommit } from 'aws-sdk';
import { on, AwsServiceMockBuilder } from '@jurijzahn8019/aws-promise-jest-mock';
import { Action, exceptions, OperationStatus, SessionProxy } from '@amazon-web-services-cloudformation/cloudformation-cli-typescript-lib';
const createFixture = require('./data/create-success.json');
const deleteFixture = require('./data/delete-success.json');
const readFixture = require('./data/read-success.json');
const updateFixture = require('./data/update-success.json');
import { resource } from '../src/handlers';

const IDENTIFIER = '123456789012';

jest.mock('aws-sdk');

describe('when calling handler', () => {
    let testEntrypointPayload: any;
    let spySession: jest.SpyInstance;
    let spySessionClient: jest.SpyInstance;
    let codecommit: AwsServiceMockBuilder<CodeCommit>;
    let fixtureMap: Map<Action, Record<string, any>>;

    beforeAll(() => {
        fixtureMap = new Map<Action, Record<string, any>>();
        fixtureMap.set(Action.Create, createFixture);
        fixtureMap.set(Action.Read, readFixture);
        fixtureMap.set(Action.Update, updateFixture);
        fixtureMap.set(Action.Delete, deleteFixture);
    });

    beforeEach(async () => {
        codecommit = on(CodeCommit, { snapshot: false });
        codecommit.mock('getApprovalRuleTemplate').resolve({
            approvalRuleTemplate: {
                approvalRuleTemplateId: 'ecc5e2e3-9bf4-4589-8759-8e788983c1fb',
                approvalRuleTemplateName: 'test',
                approvalRuleTemplateContent: '',
            },
        });
        codecommit.mock('listApprovalRuleTemplates').resolve({
            approvalRuleTemplateNames: ['test', 'test2'],
        });
        codecommit.mock('createApprovalRuleTemplate').resolve({
            approvalRuleTemplate: {
                approvalRuleTemplateName: 'test',
                approvalRuleTemplateId: IDENTIFIER,
                approvalRuleTemplateDescription: 'test',
                approvalRuleTemplateContent: '',
            },
        });
        codecommit.mock('updateApprovalRuleTemplateContent').resolve({ approvalRuleTemplate: {} });
        codecommit.mock('updateApprovalRuleTemplateDescription').resolve({ approvalRuleTemplate: {} });
        codecommit.mock('updateApprovalRuleTemplateName').resolve({ approvalRuleTemplate: {} });
        codecommit.mock('deleteApprovalRuleTemplate').resolve({});
        spySession = jest.spyOn(SessionProxy, 'getSession');
        spySessionClient = jest.spyOn<any, any>(SessionProxy.prototype, 'client');
        spySessionClient.mockReturnValue(codecommit.instance);
        testEntrypointPayload = {
            credentials: { accessKeyId: '', secretAccessKey: '', sessionToken: '' },
            region: 'us-east-1',
            action: 'CREATE',
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test('create operation successful - code commit approval rule template', async () => {
        const request = fixtureMap.get(Action.Create);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Create, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel.serialize()).toMatchObject({
            ...request.desiredResourceState,
            Id: IDENTIFIER,
        });
    });

    test('create operation fail already exists - code commit approval rule template', async () => {
        expect.assertions(2);
        const mockCreate = codecommit.mock('createApprovalRuleTemplate').reject({
            ...new Error(),
            code: 'ApprovalRuleTemplateNameAlreadyExistsException',
        });
        const request = fixtureMap.get(Action.Create);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Create, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.AlreadyExists.name });
        expect(mockCreate.mock).toHaveBeenCalledTimes(1);
    });

    test('update operation successful - code commit approval rule template', async () => {
        const request = fixtureMap.get(Action.Update);
        codecommit.mock('getApprovalRuleTemplate').resolve({
            approvalRuleTemplate: {
                approvalRuleTemplateId: '8f9be413-f9cc-49a1-b901-0a59a6f126c2',
                approvalRuleTemplateName: 'test2',
                approvalRuleTemplateDescription: 'test2',
                approvalRuleTemplateContent:
                    '{"Version": "2018-11-08","DestinationReferences": ["refs/heads/master"],"Statements": [{"Type": "Approvers","NumberOfApprovalsNeeded": 3,"ApprovalPoolMembers": ["*"]}]}',
            },
        });
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Update, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel.serialize()).toMatchObject(request.desiredResourceState);
    });

    test('delete operation successful - code commit approval rule template', async () => {
        const request = fixtureMap.get(Action.Delete);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Delete, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel).toBeNull();
    });

    test('delete operation fail not found - code commit approval rule template', async () => {
        expect.assertions(4);
        const mockGet = codecommit.mock('listApprovalRuleTemplates').reject({
            ...new Error(),
            code: 'ApprovalRuleTemplateDoesNotExistException',
        });
        const spyRetrieve = jest.spyOn<any, any>(resource, 'listRuleTemplates');
        const request = fixtureMap.get(Action.Delete);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Delete, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.NotFound.name });
        expect(mockGet.mock).toHaveBeenCalledTimes(1);
        expect(spyRetrieve).toHaveBeenCalledTimes(1);
        expect(spyRetrieve).toHaveReturned();
    });

    test('read operation successful - code commit approval rule template', async () => {
        const request = fixtureMap.get(Action.Read);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Read, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel.serialize()).toMatchObject(request.desiredResourceState);
    });

    test('read operation  fail not found - code commit approval rule template', async () => {
        expect.assertions(4);
        const mockGet = codecommit.mock('listApprovalRuleTemplates').reject({
            ...new Error(),
            code: 'ApprovalRuleTemplateDoesNotExistException',
        });
        const spyRetrieve = jest.spyOn<any, any>(resource, 'listRuleTemplates');
        const request = fixtureMap.get(Action.Read);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Read, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.NotFound.name });
        expect(mockGet.mock).toHaveBeenCalledTimes(1);
        expect(spyRetrieve).toHaveBeenCalledTimes(1);
        expect(spyRetrieve).toHaveReturned();
    });

    test('all operations fail without session - code commit approval rule template', async () => {
        expect.assertions(fixtureMap.size);
        spySession.mockReturnValue(null);
        for (const [action, request] of fixtureMap) {
            const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action, request }, null);
            expect(progress.errorCode).toBe(exceptions.InvalidCredentials.name);
        }
    });
});
