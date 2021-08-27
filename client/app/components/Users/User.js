import React, {useState, useRef, useContext} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {getSelectedStory, isAStorySelected} from '../../state/stories/storiesSelectors';
import {getMatchingCardConfig} from '../../state/room/roomSelectors';
import {getOwnUserId} from '../../state/users/usersSelectors';
import {L10nContext} from '../../services/l10n';
import {getEstimationsForCurrentlySelectedStory} from '../../state/estimations/estimationsSelectors';
import {kick, toggleExcluded} from '../../state/actions/commandActions';
import Avatar from '../common/Avatar';
import UserEstimationCard from './UserEstimationCard';
import useOutsideClick from '../common/useOutsideClick';

import {
  StyledUser,
  StyledUserBadge,
  StyledUserQuickMenu,
  StyledUserName,
  StyledEyeIcon
} from './_styled';

const User = ({
  user,
  selectedStory,
  userHasEstimation,
  ownUserId,
  matchingCardConfig,
  kick,
  toggleExcluded
}) => {
  const {t} = useContext(L10nContext);
  const quickMenuRef = useRef(null);

  const isOwnUser = user.id === ownUserId;
  const isExcluded = user.excluded;
  const isDisconnected = user.disconnected;
  const revealed = selectedStory && selectedStory.revealed;

  useOutsideClick(quickMenuRef, () => setQuickMenuShown(false));

  const [quickMenuShown, setQuickMenuShown] = useState(false);

  return (
    <StyledUser data-testid="user" isOwn={isOwnUser} shaded={isDisconnected || quickMenuShown}>
      {!isDisconnected && isExcluded && (
        <StyledUserBadge>
          <i className="icon-eye"></i>
        </StyledUserBadge>
      )}

      {isDisconnected && (
        <StyledUserBadge>
          <i className="icon-flash"></i>
        </StyledUserBadge>
      )}

      <Avatar
        onClick={() => setQuickMenuShown(true)}
        user={user}
        isOwn={user.id === ownUserId}
        shaded={isDisconnected || quickMenuShown}
      />
      <StyledUserName>{user.username || '-'}</StyledUserName>

      {quickMenuShown && (
        <StyledUserQuickMenu ref={quickMenuRef}>
          <StyledEyeIcon
            active={isExcluded}
            className="icon-eye"
            onClick={onEyeIconClick}
            title={t('markExcluded')}
          ></StyledEyeIcon>

          {!isOwnUser && (
            <i className="icon-logout" onClick={() => kick(user.id)} title={t('kickUser')}></i>
          )}
        </StyledUserQuickMenu>
      )}

      {selectedStory && (
        <UserEstimationCard
          isExcluded={isExcluded}
          userHasEstimation={userHasEstimation}
          revealed={revealed}
          matchingCardConfig={matchingCardConfig}
        />
      )}
    </StyledUser>
  );

  function onEyeIconClick() {
    toggleExcluded(user.id);
    setQuickMenuShown(false);
  }
};

User.propTypes = {
  user: PropTypes.object,
  userHasEstimation: PropTypes.bool,
  selectedStory: PropTypes.object,
  ownUserId: PropTypes.string,
  matchingCardConfig: PropTypes.object,
  kick: PropTypes.func.isRequired,
  toggleExcluded: PropTypes.func.isRequired
};

export default connect(
  (state, props) => {
    const estimationsForStory = getEstimationsForCurrentlySelectedStory(state);
    const userEstimationValue = estimationsForStory && estimationsForStory[props.user.id];
    const userHasEstimation = userEstimationValue !== undefined && userEstimationValue !== null; // value could be "0" which is falsy, check for undefined

    const matchingCardConfig = userHasEstimation
      ? getMatchingCardConfig(state, userEstimationValue)
      : {};

    return {
      userHasEstimation,
      matchingCardConfig,
      ownUserId: getOwnUserId(state),
      selectedStory: isAStorySelected(state) ? getSelectedStory(state) : undefined
    };
  },
  {kick, toggleExcluded}
)(User);
