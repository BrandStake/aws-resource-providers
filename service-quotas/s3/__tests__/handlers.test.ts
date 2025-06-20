import { ServiceQuotas } from 'aws-sdk';
import { on, AwsServiceMockBuilder, AwsFunctionMockBuilder } from '@jurijzahn8019/aws-promise-jest-mock';
import { Action, exceptions, SessionProxy, OperationStatus } from '@amazon-web-services-cloudformation/cloudformation-cli-typescript-lib';
const createFixture = require('./data/create-success.json');
const readFixture = require('./data/read-success.json');
const deleteFixture = require('./data/delete-success.json');
const updateDecreaseBucketsFixture = require('./data/update-fail-decrease-buckets.json');
const updateFixture = require('./data/update-success.json');
import { resource } from '../src/handlers';
import { ResourceModel } from '../src/models';

jest.mock('aws-sdk');

const IDENTIFIER = '123456789012';

describe('when calling handler', () => {
    let testEntrypointPayload: any;
    let spySession: jest.SpyInstance;
    let spySessionClient: jest.SpyInstance;
    let serviceQuotas: AwsServiceMockBuilder<ServiceQuotas>;
    let listRequestedServiceQuotaChangeHistoryByQuotaMock: AwsFunctionMockBuilder<ServiceQuotas>;
    let getServiceQuotaMock: AwsFunctionMockBuilder<ServiceQuotas>;
    let requestServiceQuotaIncreaseMock: AwsFunctionMockBuilder<ServiceQuotas>;
    let getAWSDefaultServiceQuota: AwsFunctionMockBuilder<ServiceQuotas>;
    let fixtureMap: Map<Action, Record<string, any>>;

    beforeAll(() => {
        fixtureMap = new Map<Action, Record<string, any>>();
        fixtureMap.set(Action.Create, createFixture);
        fixtureMap.set(Action.Read, readFixture);
        fixtureMap.set(Action.Update, updateFixture);
        fixtureMap.set(Action.Delete, deleteFixture);
    });

    beforeEach(async () => {
        serviceQuotas = on(ServiceQuotas, { snapshot: false });
        listRequestedServiceQuotaChangeHistoryByQuotaMock = serviceQuotas.mock('listRequestedServiceQuotaChangeHistoryByQuota').resolve({});
        getServiceQuotaMock = serviceQuotas.mock('getServiceQuota').resolve({});
        requestServiceQuotaIncreaseMock = serviceQuotas.mock('requestServiceQuotaIncrease').resolve({});
        getAWSDefaultServiceQuota = serviceQuotas.mock('getAWSDefaultServiceQuota').resolve({});
        spySession = jest.spyOn(SessionProxy, 'getSession');
        spySessionClient = jest.spyOn<any, any>(SessionProxy.prototype, 'client');
        spySessionClient.mockReturnValue(serviceQuotas.instance);
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

    test('create operation successful - service quotas s3', async () => {
        const request = fixtureMap.get(Action.Create);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Create, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel.serialize()).toMatchObject({ ...request.desiredResourceState, ResourceId: IDENTIFIER });

        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toBeCalledTimes(1);
        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
        expect(getServiceQuotaMock.mock).toBeCalledTimes(1);
        expect(getServiceQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
        expect(requestServiceQuotaIncreaseMock.mock).toBeCalledTimes(1);
        expect(requestServiceQuotaIncreaseMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3', DesiredValue: 100 } as any);
    });

    test('update operation successful - service quotas s3', async () => {
        const request = fixtureMap.get(Action.Update);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Update, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        expect(progress.resourceModel.serialize()).toMatchObject(request.desiredResourceState);

        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toBeCalledTimes(1);
        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
        expect(getServiceQuotaMock.mock).toBeCalledTimes(1);
        expect(getServiceQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
        expect(requestServiceQuotaIncreaseMock.mock).toBeCalledTimes(1);
        expect(requestServiceQuotaIncreaseMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3', DesiredValue: 110 } as any);
    });

    test('update decrease bucket limit fails - service quotas s3', async () => {
        const request = updateDecreaseBucketsFixture;
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Update, request }, null);
        expect(progress).toMatchObject({
            status: OperationStatus.Failed,
            message: expect.stringMatching(/Decrease of limit failed because desired value 90 is lower than previous value 100/),
            errorCode: exceptions.InternalFailure.name,
        });

        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toBeCalledTimes(0);
        expect(getServiceQuotaMock.mock).toBeCalledTimes(0);
        expect(requestServiceQuotaIncreaseMock.mock).toBeCalledTimes(0);
    });

    test('read operation successful (from change history) - service quotas s3', async () => {
        const history: ServiceQuotas.ListRequestedServiceQuotaChangeHistoryByQuotaResponse = {
            RequestedQuotas: [{ Status: 'CASE_OPENED', DesiredValue: 123 }],
        };
        listRequestedServiceQuotaChangeHistoryByQuotaMock.resolve(history as any);

        const request = fixtureMap.get(Action.Read);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Read, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        const resourceModel = progress.resourceModel as ResourceModel;
        expect(resourceModel.buckets).toBe(123);

        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toBeCalledTimes(1);
        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
        expect(getServiceQuotaMock.mock).toBeCalledTimes(0);
    });

    test('read operation successful (from service quota) - service quotas s3', async () => {
        const error = { code: 'NoSuchResourceException', message: 'not found', name: 'Error' } as Error;
        const getQuotaResponse: ServiceQuotas.GetServiceQuotaResponse = { Quota: { Value: 124 } };

        listRequestedServiceQuotaChangeHistoryByQuotaMock.reject(error);
        getServiceQuotaMock.resolve(getQuotaResponse as any);

        const request = fixtureMap.get(Action.Read);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Read, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        const resourceModel = progress.resourceModel as ResourceModel;
        expect(resourceModel.buckets).toBe(124);

        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toBeCalledTimes(1);
        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
        expect(getServiceQuotaMock.mock).toBeCalledTimes(1);
        expect(getServiceQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
    });

    test('read operation successful (from aws default) - service quotas s3', async () => {
        const error = { code: 'NoSuchResourceException', message: 'not found', name: 'Error' } as Error;
        const getQuotaResponse: ServiceQuotas.GetAWSDefaultServiceQuotaResponse = { Quota: { Value: 125 } };

        listRequestedServiceQuotaChangeHistoryByQuotaMock.reject(error);
        getServiceQuotaMock.reject(error);
        getAWSDefaultServiceQuota.resolve(getQuotaResponse as any);

        const request = fixtureMap.get(Action.Read);
        const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action: Action.Read, request }, null);
        expect(progress).toMatchObject({ status: OperationStatus.Success, message: '', callbackDelaySeconds: 0 });
        const resourceModel = progress.resourceModel as ResourceModel;
        expect(resourceModel.buckets).toBe(125);

        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toBeCalledTimes(1);
        expect(listRequestedServiceQuotaChangeHistoryByQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
        expect(getServiceQuotaMock.mock).toBeCalledTimes(1);
        expect(getServiceQuotaMock.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
        expect(getAWSDefaultServiceQuota.mock).toBeCalledTimes(1);
        expect(getAWSDefaultServiceQuota.mock).toHaveBeenCalledWith({ QuotaCode: 'L-DC2B2D3D', ServiceCode: 's3' } as any);
    });

    test('all operations fail without session - service quotas s3', async () => {
        expect.assertions(fixtureMap.size);
        spySession.mockReturnValue(null);
        for (const [action, request] of fixtureMap) {
            const progress = await resource.testEntrypoint({ ...testEntrypointPayload, action, request }, null);
            expect(progress.errorCode).toBe(exceptions.InvalidCredentials.name);
        }
    });
});
