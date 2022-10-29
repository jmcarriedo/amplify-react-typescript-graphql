import React, { useState, useEffect } from 'react';
import { API, Storage } from "aws-amplify";
import { listNotes } from "./graphql/queries";
import { GraphQLResult } from "@aws-amplify/api";
import { 
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation
} from "./graphql/mutations";
// import logo from './logo.svg';
import './App.css';
import "@aws-amplify/ui-react/styles.css";
import {
  withAuthenticator,
  Flex,
  Button,
  Heading,
  Image,
  View,
  Card,
  Text,
  TextField,
  TextAreaField,
  Menu, 
  MenuItem,
} from "@aws-amplify/ui-react";


// export class Note {
//   id: number = 0;
//   name: string = "";
//   description: string = "";
//   createdAt: string = "";
//   updatedAt: string = "";
// }

interface Note {
  id: number;
  name: string;
  description: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

const App = ({ signOut } : any ) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes }) as GraphQLResult<any>;
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note: Note) => {
        if (note.image) {
          const url= await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  } 

  
  async function createNote(event: any) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data: any = {
      name: form.get("name"),
      description: form.get("description"),
      image: image,
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: {input: data},
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote(id: number, name: string) {
    const newNotes = notes.filter((note: Note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: {id} },
    });
  }

  return (
    <View className="App">
        <Flex padding="1rem" justifyContent="end">
          <View width="4rem">
            <Menu>
              <MenuItem onClick={signOut} variation="menu">
                Sign Out
              </MenuItem>
            </Menu>
          </View>
        </Flex>
        <Heading level={1} margin="3rem 0">Notes App</Heading>
        <View as="form" margin="3rem 0" onSubmit={createNote}>
          <Flex direction="column" justifyContent="center" width="50%"
              margin="auto">
            <TextField 
              name="name"
              placeholder="Note Name"
              label="Note Name"
              labelHidden
              variation="quiet"
              autoComplete="off"
              required
            />
            <TextAreaField 
              margin="1rem 0"
              name="description"
              placeholder="Note Description"
              label="Note Description"
              labelHidden
              variation="quiet" 
              autoComplete="off"
              required
            />
            <View
              name="image"
              label="Upload Image"
              as="input"
              type="file"
              // style={{ alignSelf: "end" }}
            />
            <Button type="submit" className="colorful-button" width="10rem" margin="auto">
              Create Note
            </Button>
          </Flex>
        </View>
        <Heading level={2}>Current Notes</Heading>
        <View margin="3rem 0">
          {notes.map( (note: Note) => (
            <Flex
              key={note.id || note.name}
              direction="row"
              justifyContent="center"
              alignItems="center"
            >
              <Text as="strong" fontWeight={700}>
                {note.name}
              </Text>
              <Text as="span">
                {note.description}
              </Text>
              {note.image && (
                <Image 
                  src={note.image}
                  alt={`visual aid for ${note.name}`}
                  style={{width: '400'}}
                />
              )}
              <Button variation="link" onClick={() => deleteNote(note.id, note.name)}>
                Delete Note
              </Button>
            </Flex>
          ))}
        </View>
    </View>
  );
}

export default withAuthenticator(App);
