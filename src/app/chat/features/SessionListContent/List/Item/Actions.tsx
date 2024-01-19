import { ActionIcon, Icon } from '@lobehub/ui';
import { App, Dropdown, type MenuProps } from 'antd';
import { createStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import {
  Check,
  HardDriveDownload,
  ListTree,
  LucideCopy,
  LucidePlus,
  MoreVertical,
  Pin,
  PinOff,
  Trash,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { configService } from '@/services/config';
import { useGlobalStore } from '@/store/global';
import { preferenceSelectors } from '@/store/global/slices/common/selectors';
import { useSessionStore } from '@/store/session';
import { sessionHelpers } from '@/store/session/helpers';
import { sessionSelectors } from '@/store/session/selectors';
import { SessionDefaultGroup } from '@/types/session';

const useStyles = createStyles(({ css }) => ({
  modalRoot: css`
    z-index: 2000;
  `,
}));

interface ActionProps {
  group: string | undefined;
  id: string;
  openCreateGroupModal: () => void;
  setOpen: (open: boolean) => void;
}

const Actions = memo<ActionProps>(({ group, id, openCreateGroupModal, setOpen }) => {
  const { t } = useTranslation('common');

  const { styles } = useStyles();

  const sessionCustomGroups = useGlobalStore(preferenceSelectors.sessionCustomGroups, isEqual);
  const [pin, removeSession, pinSession, duplicateSession, updateSessionGroup] = useSessionStore(
    (s) => {
      const session = sessionSelectors.getSessionById(id)(s);
      return [
        sessionHelpers.getSessionPinned(session),
        s.removeSession,
        s.pinSession,
        s.duplicateSession,
        s.updateSessionGroup,
      ];
    },
  );

  const { modal } = App.useApp();

  const isDefault = group === SessionDefaultGroup.Default;
  // const hasDivider = !isDefault || Object.keys(sessionByGroup).length > 0;

  const items: MenuProps['items'] = useMemo(
    () => [
      {
        icon: <Icon icon={pin ? PinOff : Pin} />,
        key: 'pin',
        label: t(pin ? 'pinOff' : 'pin'),
        onClick: () => {
          pinSession(id, !pin);
        },
      },
      {
        icon: <Icon icon={LucideCopy} />,
        key: 'duplicate',
        label: t('duplicate'),
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation();

          duplicateSession(id);
        },
      },
      {
        type: 'divider',
      },
      {
        children: [
          {
            icon: isDefault ? <Icon icon={Check} /> : <div />,
            key: 'defaultList',
            label: t('defaultList'),
            onClick: () => {
              updateSessionGroup(id, SessionDefaultGroup.Default);
            },
          },
          ...sessionCustomGroups.map(({ id: groupId, name }) => ({
            icon: group === groupId ? <Icon icon={Check} /> : <div />,
            key: groupId,
            label: name,
            onClick: () => {
              updateSessionGroup(id, groupId);
            },
          })),
          {
            type: 'divider',
          },
          {
            icon: <Icon icon={LucidePlus} />,
            key: 'createGroup',
            label: <div>{t('group.createGroup')}</div>,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              openCreateGroupModal();
            },
          },
        ],
        icon: <Icon icon={ListTree} />,
        key: 'moveGroup',
        label: t('group.moveGroup'),
      },
      {
        type: 'divider',
      },
      {
        children: [
          {
            key: 'agent',
            label: t('exportType.agent'),
            onClick: () => {
              configService.exportSingleAgent(id);
            },
          },
          {
            key: 'agentWithMessage',
            label: t('exportType.agentWithMessage'),
            onClick: () => {
              configService.exportSingleSession(id);
            },
          },
        ],
        icon: <Icon icon={HardDriveDownload} />,
        key: 'export',
        label: t('export'),
      },
      {
        danger: true,
        icon: <Icon icon={Trash} />,
        key: 'delete',
        label: t('delete'),
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation();
          modal.confirm({
            centered: true,
            okButtonProps: { danger: true },
            onOk: () => {
              removeSession(id);
            },
            rootClassName: styles.modalRoot,
            title: t('confirmRemoveSessionItemAlert'),
          });
        },
      },
    ],
    [id, pin],
  );

  return (
    <Dropdown
      arrow={false}
      menu={{
        items,
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation();
        },
      }}
      onOpenChange={setOpen}
      trigger={['click']}
    >
      <ActionIcon
        icon={MoreVertical}
        size={{
          blockSize: 28,
          fontSize: 16,
        }}
      />
    </Dropdown>
  );
});

export default Actions;
