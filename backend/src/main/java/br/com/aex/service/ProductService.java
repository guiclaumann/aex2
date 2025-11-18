package br.com.aex.service;

import br.com.aex.entity.Produto;
import br.com.aex.repository.ProdutoRepository;
import br.com.aex.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProdutoRepository produtoRepository;

    // ✅ Métodos que os Controllers esperam:
    public List<Produto> getProducts() {
        return produtoRepository.findAll();
    }

    public Produto getProduct(Long id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public Produto saveProduct(Produto product) {
        return produtoRepository.save(product);
    }

    public Produto updateProduct(Long id, Produto productDetails) {
        Produto product = getProduct(id);
        product.setNome(productDetails.getNome());
        product.setDescricao(productDetails.getDescricao());
        product.setPrecoVenda(productDetails.getPrecoVenda());
        product.setCategoria(productDetails.getCategoria());
        return produtoRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Produto product = getProduct(id);
        produtoRepository.delete(product);
    }
}