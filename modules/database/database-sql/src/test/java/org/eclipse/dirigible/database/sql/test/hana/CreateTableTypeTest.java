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
package org.eclipse.dirigible.database.sql.test.hana;

import org.eclipse.dirigible.commons.config.Configuration;
import org.eclipse.dirigible.database.sql.DataType;
import org.eclipse.dirigible.database.sql.SqlFactory;
import org.eclipse.dirigible.database.sql.dialects.hana.HanaSqlDialect;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockitoAnnotations;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

public class CreateTableTypeTest {

    @Before
    public void openMocks() {
        MockitoAnnotations.initMocks(this);
    }

    /**
     * Create table type case sensitive.
     */
    @Test
    public void executeCreateTableTypeCaseSensitive() {
        Configuration.set("DIRIGIBLE_DATABASE_NAMES_CASE_SENSITIVE", "true");
        try {
            String sql = SqlFactory.getNative(new HanaSqlDialect())
                    .create()
                    .tableType("CUSTOMERS_STRUCTURE")
                    .column("CATEGORY_ID", DataType.INTEGER)
                    .column("NAME", DataType.VARCHAR, "255")
                    .column("TYPES", DataType.VARCHAR, true, false, "220")
                    .build();

            assertNotNull(sql);
            assertEquals("CREATE TYPE \"CUSTOMERS_STRUCTURE\" AS TABLE ( \"CATEGORY_ID\" INTEGER , \"NAME\" VARCHAR (255) , \"TYPES\" VARCHAR (220) NOT NULL PRIMARY KEY )", sql);
        } finally {
            Configuration.set("DIRIGIBLE_DATABASE_NAMES_CASE_SENSITIVE", "false");
        }
    }

    /**
     * Create table type.
     */
    @Test
    public void executeCreateTableType() {
        String sql = SqlFactory.getNative(new HanaSqlDialect())
                .create()
                .tableType("CUSTOMERS_STRUCTURE")
                .column("CATEGORY_ID" , DataType.INTEGER)
                .column("NAME" , DataType.VARCHAR, "255")
                .column("TYPES", DataType.VARCHAR, true, false, "220")
                .build();

        assertNotNull(sql);
        assertEquals("CREATE TYPE CUSTOMERS_STRUCTURE AS TABLE ( CATEGORY_ID INTEGER , NAME VARCHAR (255) , TYPES VARCHAR (220) NOT NULL PRIMARY KEY )", sql);
    }

    /**
     * Create table type with composite primary key.
     */
    @Test
    public void executeCreateTableTypeWithCompositePrimaryKey() {
        Configuration.set("DIRIGIBLE_DATABASE_NAMES_CASE_SENSITIVE", "true");
        try {
            String sql = SqlFactory.getNative(new HanaSqlDialect())
                    .create()
                    .tableType("CUSTOMERS_STRUCTURE")
                    .column("CATEGORY_ID", DataType.INTEGER)
                    .column("NAME", DataType.VARCHAR, true, false, "255")
                    .column("TYPES", DataType.VARCHAR, true, false, "220")
                    .build();

            assertNotNull(sql);
            assertEquals("CREATE TYPE \"CUSTOMERS_STRUCTURE\" AS TABLE ( \"CATEGORY_ID\" INTEGER , \"NAME\" VARCHAR (255) NOT NULL , \"TYPES\" VARCHAR (220) NOT NULL , PRIMARY KEY(NAME , TYPES) )", sql);
        } finally {
            Configuration.set("DIRIGIBLE_DATABASE_NAMES_CASE_SENSITIVE", "false");
        }
    }

}
