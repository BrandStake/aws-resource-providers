import { IAM } from 'aws-sdk';
import * as uuid from 'uuid';
import { on, AwsServiceMockBuilder } from '@jurijzahn8019/aws-promise-jest-mock';
import { Action, exceptions, OperationStatus, SessionProxy } from '@amazon-web-services-cloudformation/cloudformation-cli-typescript-lib';
const createInvalidRequest = require('./data/create-invalid-request.json');
const createFixture = require('./data/create-success.json');
const deleteFixture = require('./data/delete-success.json');
const listFixture = require('./data/list-success.json');
const readFixture = require('./data/read-success.json');
const updateFixture = require('./data/update-success.json');
const updateNotFound = require('./data/update-not-found.json');
const updateNotUpdatable = require('./data/update-not-updatable.json');
import { resource, PasswordPolicy } from '../src/handlers';
import { ResourceModel } from '../src/models';

const IDENTIFIER = 'f3390613-b2b5-4c31-a4c6-66813dff96a6';

jest.mock('aws-sdk');
jest.mock('uuid', () => ({
    v4: jest.fn(() => IDENTIFIER),
}));

describe('when calling handler', () => {
    let testEntrypointPayload: any;
    let spySession: jest.SpyInstance;
    let spySessionClient: jest.SpyInstance;
    let iam: AwsServiceMockBuilder<IAM>;
    let fixtureMap: Map<Action, Record<string, any>>;

    beforeAll(() => {
        fixtureMap = new Map<Action, Record<string, any>>();
        fixtureMap.set(Action.Create, createFixture);
        fixtureMap.set(Action.Read, readFixture);
        fixtureMap.set(Action.Update, updateFixture);
        fixtureMap.set(Action.Delete, deleteFixture);
        fixtureMap.set(Action.List, listFixture);
    });

    beforeEach(() => {
        iam = on(IAM, { snapshot: false });
        iam.mock('getAccountPasswordPolicy').resolve({
            PasswordPolicy: {
                MinimumPasswordLength: 6,
            },
        });
        iam.mock('updateAccountPasswordPolicy').resolve({});
        iam.mock('deleteAccountPasswordPolicy').resolve({});
        spySession = jest.spyOn(SessionProxy, 'getSession');
        spySessionClient = jest.spyOn<any, any>(SessionProxy.prototype, 'client');
        spySessionClient.mockReturnValue(iam.instance);
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

    test('create operation successful - iam password policy', async () => {
        const spyUuid = jest.spyOn(uuid, 'v4');
        const request = fixtureMap.get(Action.Create);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Create, request });
        const model = ResourceModel.deserialize({
            ...request?.desiredResourceState,
            ResourceId: IDENTIFIER,
        });
        expect(spyUuid).toHaveBeenCalledTimes(1);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel?.serialize()).toMatchObject(model.serialize());
    });

    test('create operation fail generic - iam password policy', async () => {
        expect.assertions(7);
        const mockGet = iam.mock('getAccountPasswordPolicy').reject({ ...new Error(), code: 'ServiceUnavailableException' });
        const mockUpdate = iam.mock('updateAccountPasswordPolicy').reject({ ...new Error(), code: 'ServiceUnavailableException' });
        const spyRetrieve = jest.spyOn<any, any>(resource, 'retrievePasswordPolicy');
        const spyUpsert = jest.spyOn<any, any>(resource, 'upsertPasswordPolicy');
        const request = fixtureMap.get(Action.Create);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Create, request });
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.InternalFailure.name });
        expect(mockGet.mock).toHaveBeenCalledTimes(1);
        expect(spyRetrieve).toHaveBeenCalledTimes(1);
        expect(spyRetrieve).toHaveReturned();
        expect(mockUpdate.mock).toHaveBeenCalledTimes(1);
        expect(spyUpsert).toHaveBeenCalledTimes(1);
        expect(spyUpsert).toHaveReturned();
    });

    test('create operation fail with contain identifier - iam password policy', async () => {
        const request = createInvalidRequest;
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Create, request });
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.InvalidRequest.name });
    });

    test('update operation successful - iam password policy', async () => {
        const request = fixtureMap.get(Action.Update);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Update, request });
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel?.serialize()).toMatchObject(request?.desiredResourceState);
    });

    test('update operation fail not found - iam password policy', async () => {
        const request = updateNotFound;
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Update, request });
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.NotFound.name });
    });

    test('update operation fail not updatable - iam password policy', async () => {
        const request = updateNotUpdatable;
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Update, request });
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.NotUpdatable.name });
    });

    test('delete operation successful - iam password policy', async () => {
        const request = fixtureMap.get(Action.Delete);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Delete, request });
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel).toBeNull();
    });

    test('delete operation fail not found - iam password policy', async () => {
        const mockGet = iam.mock('getAccountPasswordPolicy').reject({ ...new Error(), code: 'NoSuchEntity' });
        const spyRetrieve = jest.spyOn<any, any>(resource, 'retrievePasswordPolicy');
        const request = fixtureMap.get(Action.Delete);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Delete, request });
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.NotFound.name });
        expect(mockGet.mock).toHaveBeenCalledTimes(1);
        expect(spyRetrieve).toHaveBeenCalledTimes(1);
        expect(spyRetrieve).toHaveReturned();
    });

    test('delete operation fail generic - iam password policy', async () => {
        const mockDelete = iam.mock('deleteAccountPasswordPolicy').reject({ ...new Error(), code: 'ServiceUnavailableException' });
        const request = fixtureMap.get(Action.Delete);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Delete, request });
        expect(progress).toMatchObject({ status: OperationStatus.Failed, errorCode: exceptions.InternalFailure.name });
        expect(mockDelete.mock).toHaveBeenCalledTimes(1);
    });

    test('read operation successful - iam password policy', async () => {
        const request = fixtureMap.get(Action.Read);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Read, request });
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel?.serialize()).toMatchObject(request?.desiredResourceState);
    });

    test('list operation successful - iam password policy', async () => {
        const request = fixtureMap.get(Action.List);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.List, request });
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModels?.[0]?.serialize()).toMatchObject(request?.desiredResourceState);
    });

    test('all operations fail without session - iam password policy', async () => {
        expect.assertions(fixtureMap.size);
        spySession.mockReturnValue(null);
        jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => callback());
        for (const [action, request] of fixtureMap) {
            const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action, request });
            expect(progress.errorCode).toBe(exceptions.InvalidCredentials.name);
        }
    });
});
