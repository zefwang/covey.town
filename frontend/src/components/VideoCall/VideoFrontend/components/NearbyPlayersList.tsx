import React, { useCallback, useEffect, useState } from 'react';

import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent, ModalFooter,
  ModalHeader,
  ModalOverlay, useDisclosure
} from '@chakra-ui/react';
import useMaybeVideo from '../../../../hooks/useMaybeVideo';
import useCoveyAppState from '../../../../hooks/useCoveyAppState';
import { AUser, NeighborStatus } from '../../../../classes/TownsServiceClient';

export default function NearbyPlayersList() {
  const {isOpen, onOpen, onClose} = useDisclosure()
  const video = useMaybeVideo()
  const {apiClient, nearbyPlayers, loggedInID} = useCoveyAppState();
  const [nearbyList, setNearbyList] = useState<AUser[]>([]);

  useEffect(() => {
    const searchOutput = (async() => {
      let usersList: AUser[];

      const searchPromises = nearbyPlayers.nearbyPlayers.map((player) =>
        apiClient.searchForUsersByUsername({
          userIdSearching: loggedInID._id,
          username: player.userName
        })
      )
      const resList = await Promise.all(searchPromises);

      usersList = resList.map((res) => res.users[0]); // first user b/c exact search
      setNearbyList(usersList);
    });

    searchOutput()
  }, [nearbyPlayers]);

  const openSettings = useCallback(()=>{
    onOpen();
    video?.pauseGame();
  }, [onOpen, video]);

  const closeSettings = useCallback(()=>{
    onClose();
    video?.unPauseGame();
  }, [onClose, video]);

  const isNeighborStatus = (status: NeighborStatus | string): boolean =>
    status === 'unknown' || status === 'requestReceived' || status === 'requestSent' || status === 'neighbor';

  const handleFriendRequestClick = async (user: AUser, isRejectRequest: boolean): Promise<NeighborStatus> => {
    /*
    - unknown => send request
    - requestReceived => accept/deny request
    - requestSent => cancel request
    - neighbor => remove neighbor
     */
    let newStatus: NeighborStatus;
    if (user.relationship.status === "unknown") { // Send friend request
      const addNeighborRes = await apiClient.sendAddNeighborRequest({
        currentUserId: loggedInID._id,
        UserIdToRequest: user._id
      });
      newStatus = isNeighborStatus(addNeighborRes.status) ? addNeighborRes.status as NeighborStatus : user.relationship;
    } else if (user.relationship.status === 'requestReceived') {
      if (isRejectRequest) {
        newStatus = await apiClient.removeNeighborRequestHandler({
          currentUser: user._id,
          requestedUser: loggedInID._id
        })
      } else {
        newStatus = await apiClient.acceptRequestHandler({
          userAccepting: loggedInID._id,
          userSent: user._id
        })
      }
    } else if (user.relationship.status === 'requestSent') {
      newStatus = await apiClient.removeNeighborRequestHandler({
        currentUser: loggedInID._id,
        requestedUser: user._id
      })
    } else if (user.relationship.status === 'neighbor') {
      newStatus = await apiClient.removeNeighborMappingHandler({
        currentUser: loggedInID._id,
        neighbor: user._id
      })
    } else {
      newStatus = user.relationship;
    }

    // Refresh the updated user to get new relationship
    const postRequestUserList = nearbyList.map(async (player) => {
      if (player._id === user._id) {
        const updatedPlayer = await apiClient.searchForUsersByUsername({
          userIdSearching: loggedInID._id,
          username: player.username
        })
        return updatedPlayer.users[0];
      } else {
        return player;
      }
    })

    const resList = await Promise.all(postRequestUserList);
    setNearbyList(resList);

    closeSettings()
    return newStatus;
  }

  const labelNeighborStatus = (relationship: NeighborStatus, isRejectRequest: boolean): string => {
    let label: string;

    if (relationship.status === "unknown") {
      label = 'Send Neighbor Request';
    } else if (relationship.status === 'requestSent') {
      label = 'Remove Neighbor Request';
    } else if (relationship.status === 'requestReceived') {
      label = isRejectRequest ? 'Deny Request' : 'Accept Request';
    } else if (relationship.status === 'neighbor') {
      label = 'Remove as Neighbor';
    } else {
      label = 'Unknown';
    }
    // Have to do this stupid way because of ESLint "unnecessary else after return'
    return label;
  }

  return <>
    <MenuItem data-testid='openMenuButton' onClick={openSettings}>
      <Typography variant="body1">Nearby Players List</Typography>
    </MenuItem>
    <Modal isOpen={isOpen} onClose={closeSettings}>
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader>See relationship with nearby players</ModalHeader>
        <ModalCloseButton/>
        <ModalBody pb={6}>
          { nearbyList.map((player) => {
            return (
              <div key={`game-${player._id}`}
                   style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
              >
                <p>{ player.username }</p>
                <Button onClick={() => handleFriendRequestClick(player, false)}>
                  { labelNeighborStatus(player.relationship, false) }
                </Button>
                { player.relationship.status === 'requestReceived' &&
                  <Button onClick={() => handleFriendRequestClick(player, true)}>
                    { labelNeighborStatus(player.relationship, true) }
                  </Button>
                }
              </div>
            )
          })}
        </ModalBody>
        <ModalFooter>
          <Button onClick={closeSettings}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </>
}
