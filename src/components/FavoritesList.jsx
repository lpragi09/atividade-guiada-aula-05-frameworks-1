// src/components/FavoritesList.jsx
import React, { useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Box,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  Collapse,
} from "@mui/material";
import { Edit, Delete, Save, Cancel, LocationOn } from "@mui/icons-material";
import { TransitionGroup } from "react-transition-group";

const FavoritesList = ({ favorites, onUpdate, onDelete, onSelect }) => {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const handleEditStart = (favorite) => {
    setEditingId(favorite.id);
    setEditText(favorite.apelido);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleEditSave = () => {
    if (editText.trim()) {
      onUpdate(editingId, editText.trim());
    }
    handleEditCancel();
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Meus Endereços Salvos
      </Typography>

      {favorites.length === 0 ? (
        <Typography color="textSecondary" sx={{ mt: 2, textAlign: "center" }}>
          Sua lista está vazia.
        </Typography>
      ) : (
        <List>
          <TransitionGroup>
            {favorites.map((fav) => (
              <Collapse key={fav.id}>
                <ListItem divider disablePadding>
                  {editingId === fav.id ? (
                    <Box sx={{ display: "flex", width: "100%", p: 2, gap: 1 }}>
                      <TextField
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        fullWidth
                        autoFocus
                      />
                      <IconButton onClick={handleEditSave} color="primary">
                        <Save />
                      </IconButton>
                      <IconButton onClick={handleEditCancel}>
                        <Cancel />
                      </IconButton>
                    </Box>
                  ) : (
                    <ListItemButton
                      onClick={() => onSelect(fav)}
                      sx={{ py: 2 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "secondary.main" }}>
                          <LocationOn />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={fav.apelido}
                        secondary={`${fav.logradouro}, ${fav.localidade}/${fav.uf}`}
                      />
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStart(fav);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(fav.id);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemButton>
                  )}
                </ListItem>
              </Collapse>
            ))}
          </TransitionGroup>
        </List>
      )}
    </Box>
  );
};

export default FavoritesList;
