import React, { useCallback, useState } from 'react';
import {
    Button,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Table,
    Thead,
    Th,
    Td,
    Tr,
    useDisclosure,
    Tbody,
  } from '@chakra-ui/react';
import { Typography } from '@material-ui/core';
import {AcceptNeighborRequestRequest, ListNeighborsResponse, ListRequestsResponse, RemoveNeighborMappingRequest, RemoveNeighborRequestRequest} from '../../classes/TownsServiceClient';
import useCoveyAppState from '../../hooks/useCoveyAppState';



export default function Profile (props : {userName : string, id : string, handleJoin : (coveyRoomID : string) => Promise<void> }) : JSX.Element {
    const {userName, id, handleJoin} = props;
    const [neighbors, setNeighbors] = useState<ListNeighborsResponse>({users: []})
    const [sentRequests, setSentRequests] = useState<ListRequestsResponse>({users: []})
    const [receivedRequests, setReceivedRequests] = useState<ListRequestsResponse>({users: []})
    const {isOpen, onOpen, onClose} = useDisclosure()
    const { apiClient } = useCoveyAppState();
    
    const openProfile = useCallback(() => {
        onOpen();
        apiClient.listNeighbors(id)
            .then((users) => {
                setNeighbors(users);
            })
        apiClient.listNeighborRequestsReceived(id)
            .then((users) => {
                setReceivedRequests(users);
            })
        apiClient.listNeighborRequestsSent(id)
            .then((users) => {
                setSentRequests(users);
            })
    }, [onOpen, apiClient, id]);

    const closeProfile = useCallback(() => {
        onClose();
    }, [onClose])

    const acceptRequest = async (request : AcceptNeighborRequestRequest) => {
        await apiClient.acceptRequestHandler(request)
        openProfile();
    }

    const removeRequest = async (request : RemoveNeighborRequestRequest) => {
        await apiClient.removeNeighborRequestHandler(request);
        openProfile();
    }

    const removeNeighbor = async (request : RemoveNeighborMappingRequest) => {
        await apiClient.removeNeighborMappingHandler(request);
        openProfile();
    }

    return (
        <>
        <Button mr='5' mt='5' data-testid='openMenuButton' onClick={openProfile}>
            <Typography variant="body1">Profile</Typography>
        </Button>
        <Modal isOpen={isOpen} onClose={closeProfile} size='xl'>
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>Profile</ModalHeader>
                <ModalCloseButton/>
                <form>
                    <ModalBody pb={6}>
                        <FormControl>
                            <FormLabel htmlFor='username'>Username</FormLabel>
                            <Input value={userName} isDisabled/>
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor='password'>Password</FormLabel>
                            <Input placeholder='Password' isDisabled/>
                        </FormControl>
                        <Heading p="4" as="h4" size="md">Neighbors</Heading>
                        <FormControl>
                            <Table>
                                <Thead><Tr><Th>Neighbor</Th><Th>Status</Th><Th>Join Room</Th><Th>Remove Friend</Th></Tr></Thead>
                                <Tbody>
                                    {
                                        neighbors.users.map((user) => (
                                            <Tr key={user._id}><Td>{user.username}</Td><Td>{user.isOnline? 'Online' : 'Offline'}</Td>
                                            <Td>
                                                {user.coveyTownID && 
                                                <Button onClick={() => handleJoin(user._id)}>Join</Button>
                                                }</Td><Td><Button colorScheme='red' onClick={() => removeNeighbor({
                                                    currentUser: id,
                                                    neighbor: user._id,
                                                })}>Delete</Button></Td></Tr>
                                        ))
                                    }
                                </Tbody>
                            </Table>
                        </FormControl>
                        <Heading p="4" as="h4" size="md">Requests Sent</Heading>
                        <FormControl>
                            <Table>
                                <Thead><Tr><Th>Username</Th><Th>Delete Request</Th></Tr></Thead>
                                <Tbody>
                                    {
                                        sentRequests.users.map((user) => (
                                            <Tr key={user._id}><Td>{user.username}</Td><Td><Button colorScheme='red' onClick={() => removeRequest({
                                                currentUser: id,
                                                requestedUser: user._id,
                                            })}>Delete</Button></Td></Tr>
                                        ))
                                    }
                                </Tbody>
                            </Table>
                        </FormControl>
                        <Heading p="4" as="h4" size="md">Requests Received</Heading>
                        <FormControl>
                            <Table>
                                <Thead><Tr><Th>Username</Th><Th>Accept</Th><Th>Reject</Th></Tr></Thead>
                                <Tbody>
                                    {
                                        receivedRequests.users.map((user) => (
                                            <Tr key={user._id}><Td>{user.username}</Td><Td>
                                                <Button colorScheme='green' onClick={() => acceptRequest({
                                                    userAccepting: id,
                                                    userSent: user._id,
                                                })}>Accept</Button>
                                                </Td><Td>
                                                    <Button colorScheme='red' onClick={() => removeRequest({
                                                        currentUser: user._id,
                                                        requestedUser: id,
                                                    })}>Reject</Button>
                                                    </Td></Tr>
                                        ))
                                    }
                                </Tbody>
                            </Table>
                        </FormControl>
                    </ModalBody>
                </form>
            </ModalContent>
        </Modal>
        </>
    )
}