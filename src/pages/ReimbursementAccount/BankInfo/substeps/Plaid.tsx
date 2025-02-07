import {useIsFocused} from '@react-navigation/native';
import React, {useCallback, useEffect} from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import {withOnyx} from 'react-native-onyx';
import AddPlaidBankAccount from '@components/AddPlaidBankAccount';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import type {FormInputErrors, FormOnyxValues} from '@components/Form/types';
import useLocalize from '@hooks/useLocalize';
import type {SubStepProps} from '@hooks/useSubStep/types';
import useThemeStyles from '@hooks/useThemeStyles';
import * as BankAccounts from '@userActions/BankAccounts';
import * as ReimbursementAccountActions from '@userActions/ReimbursementAccount';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {ReimbursementAccountForm} from '@src/types/form';
import INPUT_IDS from '@src/types/form/ReimbursementAccountForm';
import type {PlaidData, ReimbursementAccount} from '@src/types/onyx';

type PlaidOnyxProps = {
    /** Reimbursement account from ONYX */
    reimbursementAccount: OnyxEntry<ReimbursementAccount>;

    /** The draft values of the bank account being setup */
    reimbursementAccountDraft: OnyxEntry<ReimbursementAccountForm>;

    /** Contains plaid data */
    plaidData: OnyxEntry<PlaidData>;
};

type PlaidProps = PlaidOnyxProps & SubStepProps;

const BANK_INFO_STEP_KEYS = INPUT_IDS.BANK_INFO_STEP;

const validate = (values: FormOnyxValues<typeof ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM>): FormInputErrors<typeof ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM> => {
    const errorFields: FormInputErrors<typeof ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM> = {};

    if (!values.selectedPlaidAccountID) {
        errorFields.selectedPlaidAccountID = 'bankAccount.error.youNeedToSelectAnOption';
    }

    return errorFields;
};

function Plaid({reimbursementAccount, reimbursementAccountDraft, onNext, plaidData}: PlaidProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const isFocused = useIsFocused();
    const selectedPlaidAccountID = reimbursementAccountDraft?.[BANK_INFO_STEP_KEYS.PLAID_ACCOUNT_ID] ?? '';

    useEffect(() => {
        const plaidBankAccounts = plaidData?.bankAccounts ?? [];
        if (isFocused || plaidBankAccounts.length) {
            return;
        }
        BankAccounts.setBankAccountSubStep(null);
    }, [isFocused, plaidData]);

    const handleNextPress = useCallback(() => {
        const selectedPlaidBankAccount = (plaidData?.bankAccounts ?? []).find(
            (account) => account.plaidAccountID === reimbursementAccountDraft?.[BANK_INFO_STEP_KEYS.PLAID_ACCOUNT_ID] ?? null,
        );

        const bankAccountData = {
            [BANK_INFO_STEP_KEYS.ROUTING_NUMBER]: selectedPlaidBankAccount?.[BANK_INFO_STEP_KEYS.ROUTING_NUMBER],
            [BANK_INFO_STEP_KEYS.ACCOUNT_NUMBER]: selectedPlaidBankAccount?.[BANK_INFO_STEP_KEYS.ACCOUNT_NUMBER],
            [BANK_INFO_STEP_KEYS.PLAID_MASK]: selectedPlaidBankAccount?.mask,
            [BANK_INFO_STEP_KEYS.IS_SAVINGS]: selectedPlaidBankAccount?.[BANK_INFO_STEP_KEYS.IS_SAVINGS],
            [BANK_INFO_STEP_KEYS.BANK_NAME]: plaidData?.[BANK_INFO_STEP_KEYS.BANK_NAME] ?? '',
            [BANK_INFO_STEP_KEYS.PLAID_ACCOUNT_ID]: selectedPlaidBankAccount?.[BANK_INFO_STEP_KEYS.PLAID_ACCOUNT_ID],
            [BANK_INFO_STEP_KEYS.PLAID_ACCESS_TOKEN]: plaidData?.[BANK_INFO_STEP_KEYS.PLAID_ACCESS_TOKEN] ?? '',
        };

        ReimbursementAccountActions.updateReimbursementAccountDraft(bankAccountData);
        onNext();
    }, [plaidData, reimbursementAccountDraft, onNext]);

    const bankAccountID = Number(reimbursementAccount?.achData?.bankAccountID ?? '0');

    return (
        <FormProvider
            formID={ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM}
            validate={validate}
            onSubmit={handleNextPress}
            scrollContextEnabled
            submitButtonText={translate('common.next')}
            style={[styles.mh5, styles.flexGrow1]}
        >
            <InputWrapper
                // @ts-expect-error TODO: Remove this once AddPlaidBankAccount (https://github.com/Expensify/App/issues/25119) is migrated to TypeScript
                InputComponent={AddPlaidBankAccount}
                text={translate('bankAccount.plaidBodyCopy')}
                onSelect={(plaidAccountID: string) => {
                    ReimbursementAccountActions.updateReimbursementAccountDraft({plaidAccountID});
                }}
                plaidData={plaidData}
                onExitPlaid={() => BankAccounts.setBankAccountSubStep(null)}
                allowDebit
                bankAccountID={bankAccountID}
                selectedPlaidAccountID={selectedPlaidAccountID}
                isDisplayedInNewVBBA
                inputID={BANK_INFO_STEP_KEYS.SELECTED_PLAID_ACCOUNT_ID}
                inputMode={CONST.INPUT_MODE.TEXT}
                style={[styles.mt5]}
                defaultValue={selectedPlaidAccountID}
            />
        </FormProvider>
    );
}

Plaid.displayName = 'Plaid';

export default withOnyx<PlaidProps, PlaidOnyxProps>({
    // @ts-expect-error: ONYXKEYS.REIMBURSEMENT_ACCOUNT is conflicting with ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM
    reimbursementAccount: {
        key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
    },
    reimbursementAccountDraft: {
        key: ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM_DRAFT,
    },
    plaidData: {
        key: ONYXKEYS.PLAID_DATA,
    },
})(Plaid);
