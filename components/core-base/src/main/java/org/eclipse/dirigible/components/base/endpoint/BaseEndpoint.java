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
package org.eclipse.dirigible.components.base.endpoint;

/**
 * The Class BaseEndpoint.
 */
public abstract class BaseEndpoint {
	
	/** The Constant DEFAULT_PAGE_SIZE. */
	public static final int DEFAULT_PAGE_SIZE = 100;
	
	/** The Constant PREFIX_ENDPOINT_SECURED. */
	public static final String PREFIX_ENDPOINT_SECURED = "services/v8/";
	
	/** The Constant PREFIX_ENDPOINT_CORE. */
	public static final String PREFIX_ENDPOINT_CORE = "services/v8/core/";
	
	/** The Constant PREFIX_ENDPOINT_DATA. */
	public static final String PREFIX_ENDPOINT_DATA = "services/v8/data/";
	
	/** The Constant PREFIX_ENDPOINT_CORE. */
	public static final String PREFIX_ENDPOINT_UNIT = "services/v8/unit/";
	
	/** The Constant PREFIX_ENDPOINT_CORE. */
	public static final String PREFIX_ENDPOINT_ENGINE = "services/v8/engine/";
	
	/** The Constant PREFIX_ENDPOINT_CORE. */
	public static final String PREFIX_ENDPOINT_IDE = "services/v8/ide/";
	
	/** The Constant PREFIX_ENDPOINT_PUBLIC. */
	public static final String PREFIX_ENDPOINT_PUBLIC = "public/v8/";
	
	/** The Constant PREFIX_ENDPOINT_WEBSOCKETS. */
	public static final String PREFIX_ENDPOINT_WEBSOCKETS = "/websockets/v8/";
	
}
