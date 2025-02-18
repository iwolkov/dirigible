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
package org.eclipse.dirigible.tests;

import java.io.IOException;

import org.eclipse.dirigible.api.v3.test.AbstractApiSuiteTest;
import org.eclipse.dirigible.commons.api.context.ContextException;
import org.eclipse.dirigible.commons.api.scripting.ScriptingException;
import org.eclipse.dirigible.commons.config.Configuration;
import org.eclipse.dirigible.core.extensions.api.ExtensionsException;
import org.eclipse.dirigible.repository.api.RepositoryWriteException;
import org.junit.Before;
import org.junit.Test;
import org.testcontainers.containers.CassandraContainer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.elasticsearch.ElasticsearchContainer;
import org.testcontainers.utility.DockerImageName;

import utils.TestContainerConstants;

public class GraaliumApiSuiteTest extends AbstractApiSuiteTest {

	/* (non-Javadoc)
	 * @see org.eclipse.dirigible.api.v3.test.AbstractApiSuiteTest#setUp()
	 */
	@Override
	@Before
	public void setUp() throws Exception {
		super.setUp();

		if(Boolean.parseBoolean(Configuration.get(TestContainerConstants.CASSANDRA_POM_CONST,"false"))){
			CassandraContainer cassandra = new CassandraContainer(TestContainerConstants.CASSANDRA_DOCKER_IMEGE);
			cassandra.start();

			Configuration.set(TestContainerConstants.DIRIGIBLE_CASSANDRA_CLIENT_URI_CONST,cassandra.getHost()+":"+ cassandra.getFirstMappedPort());
		}

		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.RABBITMQ_POM_CONST, "false"))) {
			RabbitMQContainer rabbit = new RabbitMQContainer(TestContainerConstants.RABBITMQ_DOCKER_IMAGE);
			rabbit.start();

			Configuration.set(TestContainerConstants.DIRIGIBLE_RABBITMQ_CLIENT_URI_CONST,
					rabbit.getHost() + ":" + rabbit.getFirstMappedPort());
		}
		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.ELASTICSEARCH_POM_CONST, "false"))) {
			ElasticsearchContainer container = new ElasticsearchContainer(TestContainerConstants.ELASTICSEARCH_DOCKER_IMAGE);
			container.start();

			Configuration.set(TestContainerConstants.DIRIGIBLE_ELASTICSEARCH_CLIENT_HOSTNAME_CONST, container.getHost());
			Configuration.set(TestContainerConstants.DIRIGIBLE_ELASTICSEARCH_CLIENT_PORT_CONST,
					container.getFirstMappedPort().toString());
		}
		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.REDIS_POM_CONST, "false"))) {
			GenericContainer redis = new GenericContainer(DockerImageName.parse(TestContainerConstants.REDIS_DOCKER_IMAGE))
					.withExposedPorts(6379);
			redis.start();

			Configuration.set(TestContainerConstants.DIRIGIBLE_REDIS_CLIENT_URI_CONST,
					redis.getHost() + ":" + redis.getFirstMappedPort());
		}
//		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.ETCD_POM_CONST, "false"))) {
//			etcd = new EtcdClusterExtension(TestContainerConstants.ETCD_CLUSTER_IMAGE, 1);
//			etcd.start();
//			Configuration.set(TestContainerConstants.DIRIGIBLE_ETCD_CLIENT_ENDPOINT_CONST, etcd.getClientEndpoints().get(0).toString());
//		}
	}

	@Override
	public void registerModules() {
		registerModulesV4();

		if(Boolean.parseBoolean(Configuration.get(TestContainerConstants.CASSANDRA_POM_CONST,"false"))){
			cassandraRegisterModule();
		}

//		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.SPARK_POM_CONST, "false"))) {
//			sparkRegisterModule();
//		}
		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.RABBITMQ_POM_CONST, "false"))) {
			registerModulesRabbitMQ();
		}
		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.ELASTICSEARCH_POM_CONST, "false"))) {
			registerModulesElastic();
		}
		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.REDIS_POM_CONST, "false"))) {
			registerModulesRedisExt();
		}
		if (Boolean.parseBoolean(Configuration.get(TestContainerConstants.ETCD_POM_CONST, "false"))) {
			registerModulesEtcd();
		}
	}

	/**
	 * Run suite.
	 *
	 * @throws RepositoryWriteException the repository write exception
	 * @throws IOException Signals that an I/O exception has occurred.
	 * @throws ScriptingException the scripting exception
	 * @throws ContextException the context exception
	 * @throws ExtensionsException the extensions exception
	 */
	@Test
	public void runSuite() throws RepositoryWriteException, IOException, ScriptingException, ContextException, ExtensionsException {
		super.runSuite(getJavascriptEngineExecutor(), getRepository());
	}
	
}