// src/components/FavoritesList.jsx
import React, { useMemo, useState } from "react";
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
  Stack,
  Tooltip,
  InputAdornment,
  Chip,
} from "@mui/material";
import {
  Edit,
  Delete,
  Save,
  Cancel,
  LocationOn,
  Bookmarks,
  FilterList,
  Map as MapIcon,
} from "@mui/icons-material";
import { TransitionGroup } from "react-transition-group";
import { colorForUf, formatCep, googleMapsUrl } from "../utils/geo";

const FavoritesList = ({ favorites, selectedId, onUpdate, onDelete, onSelect }) => {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState("");

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

  const handleEditKey = (e) => {
    if (e.key === "Enter") handleEditSave();
    if (e.key === "Escape") handleEditCancel();
  };

  // Filtro por apelido, rua, bairro, cidade, UF ou CEP.
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((fav) =>
      [fav.apelido, fav.logradouro, fav.bairro, fav.localidade, fav.uf, fav.cep]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [favorites, filter]);

  return (
    <Box sx={{ mt: 4 }}>
      <Stack
        direction="row"
        sx={{ mb: 1.5, alignItems: "center", justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Bookmarks color="primary" />
          <Typography variant="h6" component="h2">
            Meus lugares
          </Typography>
          <Chip label={favorites.length} size="small" />
        </Stack>
      </Stack>

      {favorites.length > 2 && (
        <TextField
          size="small"
          fullWidth
          placeholder="Filtrar por nome, rua, cidade, UF ou CEP"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ mb: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FilterList fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {favorites.length === 0 ? (
        <Box
          sx={{
            mt: 1,
            p: 3,
            textAlign: "center",
            borderRadius: 3,
            border: "1px dashed",
            borderColor: "divider",
            color: "text.secondary",
          }}
        >
          <LocationOn sx={{ fontSize: 36, mb: 1, opacity: 0.6 }} />
          <Typography variant="body2">
            Nenhum lugar salvo ainda. Busque um CEP e clique em <strong>Salvar</strong>.
          </Typography>
        </Box>
      ) : visible.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          Nada encontrado para "{filter}".
        </Typography>
      ) : (
        <List disablePadding>
          <TransitionGroup>
            {visible.map((fav) => {
              const color = colorForUf(fav.uf);
              const isSelected = fav.id === selectedId;

              return (
                <Collapse key={fav.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      mb: 1,
                      borderRadius: 3,
                      border: 1,
                      borderColor: isSelected ? "primary.main" : "divider",
                      bgcolor: "background.paper",
                      overflow: "hidden",
                      transition: "border-color 0.2s, transform 0.2s",
                      "&:hover": { transform: "translateY(-1px)" },
                    }}
                  >
                    {editingId === fav.id ? (
                      <Box sx={{ display: "flex", width: "100%", p: 1.5, gap: 1 }}>
                        <TextField
                          size="small"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={handleEditKey}
                          fullWidth
                          autoFocus
                          label="Apelido"
                        />
                        <Tooltip title="Salvar (Enter)">
                          <IconButton onClick={handleEditSave} color="primary">
                            <Save />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar (Esc)">
                          <IconButton onClick={handleEditCancel}>
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <ListItemButton
                        onClick={() => onSelect(fav)}
                        selected={isSelected}
                        sx={{ py: 1.5, pr: 1 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: color, fontWeight: 700, fontSize: 14 }}>
                            {fav.uf || <LocationOn />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={fav.apelido}
                          secondary={[
                            fav.logradouro,
                            fav.bairro,
                            `${fav.localidade}/${fav.uf}`,
                            `CEP ${formatCep(fav.cep)}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          slotProps={{
                            primary: { fontWeight: 600, noWrap: true },
                            secondary: { noWrap: true },
                          }}
                        />
                        <Stack direction="row" sx={{ ml: 1 }}>
                          <Tooltip title="Abrir no Google Maps">
                            <IconButton
                              size="small"
                              component="a"
                              href={googleMapsUrl(fav.coordinates, fav)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MapIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Renomear">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(fav);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remover">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(fav.id);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </ListItemButton>
                    )}
                  </ListItem>
                </Collapse>
              );
            })}
          </TransitionGroup>
        </List>
      )}
    </Box>
  );
};

export default FavoritesList;
