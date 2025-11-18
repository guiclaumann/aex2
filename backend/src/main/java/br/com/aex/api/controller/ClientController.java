package br.com.aex.api.controller;

import br.com.aex.api.dto.client.ClientDtoV1;
import br.com.aex.api.dto.client.ClientOrderResponseDtoV1;
import br.com.aex.api.dto.client.ClientPatchDtoV1;
import br.com.aex.api.dto.client.ClientResponseDtoV1;
import br.com.aex.entity.Cliente;
import br.com.aex.service.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder; // ✅ IMPORT ADICIONADO

import java.net.URI;

import static br.com.aex.api.Endpoints.V1_CLIENT;

@RestController
@RequestMapping(V1_CLIENT)
@Tag(name = "Client Management", description = "Operations related to Clients")
public class ClientController {

    final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    @Operation(summary = "Get Client by telephone number")
    @Parameter(name = "telephone", in = ParameterIn.QUERY, description = "Telephone number")
    public ResponseEntity<ClientResponseDtoV1> getClient(@RequestParam final String telephone) {
        final Cliente client = clientService.getClient(telephone);
        final ClientResponseDtoV1 response = ClientResponseDtoV1.from(client);
        return ResponseEntity.ok(response);
    }

    @GetMapping(path = "/{id}")
    @Operation(summary = "Get Client by ID")
    @Parameter(name = "id", in = ParameterIn.PATH, description = "Client ID")
    public ResponseEntity<ClientResponseDtoV1> getClient(@PathVariable final Long id) {
        final Cliente client = clientService.getClient(id);
        final ClientResponseDtoV1 response = ClientResponseDtoV1.from(client);
        return ResponseEntity.ok(response);
    }

    @GetMapping(path = "/{id}/orders")
    @Operation(summary = "Get Client orders by ID")
    @Parameter(name = "id", in = ParameterIn.PATH, description = "Client ID")
    public ResponseEntity<ClientOrderResponseDtoV1> getClientOrders(@PathVariable final Long id) {
        final Cliente client = clientService.getClient(id);
        final ClientOrderResponseDtoV1 response = ClientOrderResponseDtoV1.from(client);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Create Client")
    public ResponseEntity<ClientResponseDtoV1> createClient(@RequestBody @Valid final ClientDtoV1 clientDto) {
        // Converter DTO para Entity
        Cliente cliente = new Cliente();
        cliente.setNome(clientDto.nome());
        cliente.setTelefone(clientDto.telefone());
        
        final Cliente savedClient = clientService.saveClient(cliente);
        final ClientResponseDtoV1 response = ClientResponseDtoV1.from(savedClient);
        
        final URI uri = UriComponentsBuilder
                .fromPath(V1_CLIENT + "/{id}")
                .buildAndExpand(savedClient.getId())
                .toUri();

        return ResponseEntity.created(uri).body(response);
    }

    @PatchMapping(path = "/{id}")
    @Operation(summary = "Patch Client by ID")
    @Parameter(name = "id", in = ParameterIn.PATH, description = "Client ID")
    public ResponseEntity<ClientResponseDtoV1> patchClient(@PathVariable final Long id, @RequestBody @Valid final ClientPatchDtoV1 patchDto) {
        // Converter DTO para Entity
        Cliente clienteDetails = new Cliente();
        if (patchDto.nome() != null) {
            clienteDetails.setNome(patchDto.nome());
        }
        if (patchDto.telefone() != null) {
            clienteDetails.setTelefone(patchDto.telefone());
        }
        
        final Cliente updatedClient = clientService.patchClient(id, clienteDetails);
        final ClientResponseDtoV1 response = ClientResponseDtoV1.from(updatedClient);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping(path = "/{id}")
    @Operation(summary = "Delete Client by ID")
    @Parameter(name = "id", in = ParameterIn.PATH, description = "Client ID")
    public ResponseEntity<Cliente> deleteClient(@PathVariable final Long id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }
}