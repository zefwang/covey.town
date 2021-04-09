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
// @ts-ignore
import React, { useCallback, useEffect, useState } from 'react';
import useMaybeVideo from '../../../../hooks/useMaybeVideo';
import useCoveyAppState from '../../../../hooks/useCoveyAppState';
import { AUser } from '../../../../classes/TownsServiceClient';

export default function NearbyPlayersList() {
  const {isOpen, onOpen, onClose} = useDisclosure()
  const video = useMaybeVideo()
  const {apiClient, nearbyPlayers, loggedInID} = useCoveyAppState();
  const [nearbyList, setNearbyList] = useState<AUser[]>([]);
  //
  // console.log(nearbyPlayers);
  // console.log('loggedIn', loggedInID._id)
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
              <div key={`game-${player._id}`}>
                <p>{ player.username }</p>
                <p>{ player.relationship }</p>
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
