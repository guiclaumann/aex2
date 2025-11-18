package br.com.aex.service;

import br.com.aex.entity.Cliente;
import br.com.aex.repository.ClienteRepository;
import br.com.aex.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClienteRepository clienteRepository;

    // ✅ Métodos que os Controllers esperam:
    public List<Cliente> getClients() {
        return clienteRepository.findAll();
    }

    public Cliente getClient(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));
    }

    public Cliente getClient(String telefone) {
        return clienteRepository.findByTelefone(telefone)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with telefone: " + telefone));
    }

    public Cliente saveClient(Cliente client) {
        return clienteRepository.save(client);
    }

    public Cliente patchClient(Long id, Cliente clientDetails) {
        Cliente client = getClient(id);
        if (clientDetails.getNome() != null) {
            client.setNome(clientDetails.getNome());
        }
        if (clientDetails.getTelefone() != null) {
            client.setTelefone(clientDetails.getTelefone());
        }
        return clienteRepository.save(client);
    }

    public void deleteClient(Long id) {
        Cliente client = getClient(id);
        clienteRepository.delete(client);
    }
}