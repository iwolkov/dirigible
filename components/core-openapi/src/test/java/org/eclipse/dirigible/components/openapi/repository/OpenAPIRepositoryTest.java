package org.eclipse.dirigible.components.openapi.repository;

import org.eclipse.dirigible.components.openapi.domain.OpenAPI;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ComponentScan(basePackages = {"org.eclipse.dirigible.components"})
@EntityScan("org.eclipse.dirigible.components")
@Transactional
public class OpenAPIRepositoryTest {
    @Autowired
    private OpenAPIRepository openAPIRepository;

    @Autowired
    EntityManager entityManager;

    @BeforeEach
    public void setup() {
        // Create test OpenAPIs
        openAPIRepository.save(createOpenAPI("/a/b/c/test1.openapi", "test1", "description"));
        openAPIRepository.save(createOpenAPI("/a/b/c/test2.openapi", "test2", "description"));
        openAPIRepository.save(createOpenAPI("/a/b/c/test3.openapi", "test3", "description"));
        openAPIRepository.save(createOpenAPI("/a/b/c/test4.openapi", "test4", "description"));
        openAPIRepository.save(createOpenAPI("/a/b/c/test5.openapi", "test5", "description"));
    }

    @AfterEach
    public void cleanup() {
        // Delete test OpenAPIs
        openAPIRepository.findAll().stream().forEach(openAPI -> openAPIRepository.delete(openAPI));
    }

    @Test
    public void getOne() {
        Long id = openAPIRepository.findAll().get(0).getId();
        Optional<OpenAPI> optional = openAPIRepository.findById(id);
        OpenAPI openAPI = optional.isPresent() ? optional.get() : null;
        assertNotNull(openAPI);
        assertNotNull(openAPI.getLocation());
        assertNotNull(openAPI.getCreatedBy());
        assertEquals("SYSTEM", openAPI.getCreatedBy());
        assertNotNull(openAPI.getCreatedAt());
    }

    @Test
    public void getReferenceUsingEntityManager() {
        Long id = openAPIRepository.findAll().get(0).getId();
        OpenAPI openAPI = entityManager.getReference(OpenAPI.class, id);
        assertNotNull(openAPI);
        assertNotNull(openAPI.getLocation());
    }

    /**
     * Creates the openapi.
     *
     * @param location    the location
     * @param name        the name
     * @param description the description
     * @return the openapi
     */
    public static OpenAPI createOpenAPI(String location, String name, String description) {
        OpenAPI openAPI = new OpenAPI(location, name, description);
        return openAPI;
    }

    @SpringBootApplication
    static class TestConfiguration {
    }
}