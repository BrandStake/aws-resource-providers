// This is a generated file. Modifications will be overwritten.
import { BaseModel, Dict, integer, Integer, Optional, transformValue } from '@amazon-web-services-cloudformation/cloudformation-cli-typescript-lib';
import { Exclude, Expose, Type, Transform } from 'class-transformer';

export class ResourceModel extends BaseModel {
    ['constructor']: typeof ResourceModel;

    @Exclude()
    public static readonly TYPE_NAME: string = 'Community::SecurityHub::SecurityControl';

    @Exclude()
    protected readonly IDENTIFIER_KEY_CONTROLID: string = '/properties/ControlId';

    @Expose({ name: 'ControlId' })
    @Transform(
        ({ value, obj }: { value: any, obj: any }) =>
            transformValue(String, 'controlId', value, obj, []),
        {
            toClassOnly: true,
        }
    )
    controlId?: Optional<string>;
    @Expose({ name: 'SuppressionsUpdatedBy' })
    @Transform(
        ({ value, obj }: { value: any, obj: any }) =>
            transformValue(String, 'suppressionsUpdatedBy', value, obj, []),
        {
            toClassOnly: true,
        }
    )
    suppressionsUpdatedBy?: Optional<string>;
    @Expose({ name: 'SuppressCurrentFindingsOnDisabled' })
    @Transform(
        ({ value, obj }: { value: any, obj: any }) =>
            transformValue(Boolean, 'suppressCurrentFindingsOnDisabled', value, obj, []),
        {
            toClassOnly: true,
        }
    )
    suppressCurrentFindingsOnDisabled?: Optional<boolean>;
    @Expose({ name: 'ControlStatus' })
    @Transform(
        ({ value, obj }: { value: any, obj: any }) =>
            transformValue(String, 'controlStatus', value, obj, []),
        {
            toClassOnly: true,
        }
    )
    controlStatus?: Optional<string>;
    @Expose({ name: 'DisabledReason' })
    @Transform(
        ({ value, obj }: { value: any, obj: any }) =>
            transformValue(String, 'disabledReason', value, obj, []),
        {
            toClassOnly: true,
        }
    )
    disabledReason?: Optional<string>;

    @Exclude()
    public getPrimaryIdentifier(): Dict {
        const identifier: Dict = {};
        if (this.controlId != null) {
            identifier[this.IDENTIFIER_KEY_CONTROLID] = this.controlId;
        }

        // only return the identifier if it can be used, i.e. if all components are present
        return Object.keys(identifier).length === 1 ? identifier : null;
    }

    @Exclude()
    public getAdditionalIdentifiers(): Array<Dict> {
        const identifiers: Array<Dict> = new Array<Dict>();
        // only return the identifiers if any can be used
        return identifiers.length === 0 ? null : identifiers;
    }
}

export class TypeConfigurationModel extends BaseModel {
    ['constructor']: typeof TypeConfigurationModel;



}

