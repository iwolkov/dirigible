/*
 * Copyright (c) 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.dirigible.components.security.endpoint;

import org.eclipse.dirigible.components.security.repository.SecurityAccessRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.eclipse.dirigible.components.security.repository.SecurityAccessRepositoryTest.createSecurityAccess;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = {SecurityAccessRepository.class})
@AutoConfigureMockMvc
@ComponentScan(basePackages = {"org.eclipse.dirigible.components"})
@EntityScan("org.eclipse.dirigible.components")
@Transactional
class SecurityAccessEndpointTest {

    @Autowired
    private SecurityAccessRepository securityAccessRepository;

    @Autowired
    MockMvc mockMvc;

    @BeforeEach
    public void setup() {
        // Create test security accesses
        securityAccessRepository.save(createSecurityAccess("/a/b/c/test1.access", "test1", "description", "HTTP", "/a" +
                "/b/c/test1.txt", "GET", "test_role_1"));
        securityAccessRepository.save(createSecurityAccess("/a/b/c/test2.access", "test2", "description", "HTTP", "/a" +
                "/b/c/test2.txt", "GET", "test_role_2"));
    }

    @AfterEach
    public void cleanup() {
        // Delete test security accesses
        securityAccessRepository.findAll().stream().forEach(securityAccess -> securityAccessRepository.delete(securityAccess));
    }

    @Test
    public void testGetSecurityAccesses() throws Exception {
        mockMvc.perform(get("/services/v8/core/security/access").accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @SpringBootApplication
    static class TestConfiguration {
    }
}