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
package org.eclipse.dirigible.databases.processor.format;

import org.eclipse.dirigible.commons.config.Configuration;

/**
 * The Abstract ResultSet Writer.
 */
public abstract class AbstractResultSetWriter<T> implements ResultSetWriter<T> {
	
	private static final String DIRIGIBLE_DATABASE_DEFAULT_QUERY_LIMIT = "DIRIGIBLE_DATABASE_DEFAULT_QUERY_LIMIT";

	private int limit = 1000;

	private boolean limited = true;
	
	private boolean stringify = true;
	
	public AbstractResultSetWriter() {
		this.limit = Integer.parseInt(Configuration.get(DIRIGIBLE_DATABASE_DEFAULT_QUERY_LIMIT, "1000"));
	}
	
	/**
	 * Getter for the limit
	 * 
	 * @return the limit
	 */
	public int getLimit() {
		return limit;
	}
	
	/**
	 * Setter for the limit
	 * 
	 * @param limit the limit
	 */
	public void setLimit(int limit) {
		this.limit = limit;
	}

	/**
	 * Checks if is limited.
	 *
	 * @return true, if is limited
	 */
	public boolean isLimited() {
		return limited;
	}

	/**
	 * Sets the limited.
	 *
	 * @param limited
	 *            the new limited
	 */
	public void setLimited(boolean limited) {
		this.limited = limited;
	}
	
	/**
	 * Checks if is stringified.
	 *
	 * @return true, if is stringified
	 */
	public boolean isStringified() {
		return stringify;
	}

	/**
	 * Sets the stringified.
	 *
	 * @param stringified
	 *            the new stringified
	 */
	public void setStringified(boolean stringify) {
		this.stringify = stringify;
	}

}
