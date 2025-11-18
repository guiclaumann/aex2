package br.com.aex.service.exception;

public class ResourceNotFoundException extends RuntimeException {
    
    public ResourceNotFoundException(String message) {
        super(message);  // ✅ Apenas 1 parâmetro
    }
}