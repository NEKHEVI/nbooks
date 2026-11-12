import { Button, Classes, Intent } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import * as FF from 'fp-ts/function';
import { FormattedMessage as T } from '@/components';
import { DialogsName } from '@/constants/dialogs';
import {
  withDialogActions,
  WithDialogActionsProps,
} from '@/containers/Dialog/withDialogActions';

function TaxRateFormDialogFormFooterRoot({
  closeDialog,
}: Pick<WithDialogActionsProps, 'closeDialog'>) {
  const { isSubmitting } = useFormikContext();

  const handleClose = () => {
    closeDialog(DialogsName.TaxRateForm);
  };

  return (
    <div className={Classes.DIALOG_FOOTER}>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>
        <Button
          disabled={isSubmitting}
          onClick={handleClose}
          style={{ minWidth: '75px' }}
        >
          <T id={'close'} />
        </Button>

        <Button
          intent={Intent.PRIMARY}
          loading={isSubmitting}
          style={{ minWidth: '95px' }}
          type="submit"
        >
          <T id={'submit'} />
        </Button>
      </div>
    </div>
  );
}

export const TaxRateFormDialogFormFooter = FF.pipe(
  TaxRateFormDialogFormFooterRoot,
  withDialogActions,
);
